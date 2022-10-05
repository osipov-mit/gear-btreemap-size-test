#!/usr/bin/env node

import { GearApi, getWasmMetadata, GearKeyring, CreateType } from '@gear-js/api';
import { createWriteStream, readFileSync, writeFileSync } from 'fs';
import { EventEmitter } from 'stream';

const metaWasm = readFileSync('./target/wasm32-unknown-unknown/release/test_1000.meta.wasm');

const cmd = process.argv[2];
const programId = cmd === 'upload' ? undefined : process.argv[3];

const INCREASE = 10;

const api = new GearApi();

const newMessageEmitter = new EventEmitter();

function generateMap(from, to) {
  const map = {};
  for (let i = from; i < from + (to || INCREASE); i++) {
    map[CreateType.create('u256', i).toHex()] = i * 12345;
  }
  return map;
}

function listenToBalanceUnreserved() {
  const stream = createWriteStream('./gas.json');
  const blockGas = api.blockGasLimit.toBigInt();
  const counter = 0;
  stream.write(`{\n`);
  api.query.system.events((events) => {
    events
      .filter((event) => api.events.balances.Unreserved.is(event))
      .forEach((event) => {
        const burned = blockGas - event.event.data.amount.toBigInt();
        stream.write(`${counter}: "${burned.toString()}",\n`);
      });
  });
}

function listenToMessagesDispatched() {
  const messages = new Map();
  api.gearEvents.subscribeToGearEvent('MessagesDispatched', (event) => {
    event.data.statuses.forEach((value, key) => {
      messages.set(key.toHex(), value.isSuccess ? true : false);
      newMessageEmitter.emit('event', key.toHex(), value.isSuccess);
    });
  });
  return (id) => {
    if (messages.has(id)) {
      const isSuccess = messages.get(id);
      messages.delete(id);
      return isSuccess;
    }
  };
}

async function upload(acc, meta) {
  const optWasm = readFileSync('./target/wasm32-unknown-unknown/release/test_1000.opt.wasm');

  const { programId } = api.program.upload(
    { code: optWasm, initPayload: generateMap(0, 500), gasLimit: api.blockGasLimit },
    meta,
  );

  return new Promise((resolve, reject) =>
    api.program.signAndSend(acc, (result) => {
      result.events.forEach(({ event }) => {
        const { method } = event;
        if (method === 'ExtrinsicSuccess') {
          resolve(programId);
        } else if (method === 'ExtrinsicFailed') {
          reject(api.getExtrinsicFailedError(event));
        }
      });
    }),
  );
}

async function readState() {
  const state = await api.programState.read(programId, metaWasm);
  console.log(Object.keys(state.toHuman()).length);
}

async function send(acc, meta, map) {
  const payload = CreateType.create(meta.handle_input, map, meta);

  api.message.send({ destination: programId, gasLimit: api.blockGasLimit, payload: payload.toHex() }, meta);

  return new Promise((resolve, reject) =>
    api.message.signAndSend(acc, (result) => {
      result.events.forEach(({ event }) => {
        const { method, data } = event;
        if (method === 'MessageEnqueued' && result.status.isFinalized) {
          resolve(data.id.toHex());
        } else if (method === 'ExtrinsicFailed') {
          reject(api.getExtrinsicFailedError(event));
        }
      });
    }),
  );
}

const main = async () => {
  await api.isReady;
  const meta = await getWasmMetadata(metaWasm);
  const acc = await GearKeyring.fromSuri('//Alice');

  if (cmd === 'upload') {
    console.log(await upload(acc, meta));
  }

  if (cmd === 'send') {
    process.stdout.write(`Total: 500`);
    listenToMessagesDispatched();
    const messages = new Map();
    listenToBalanceUnreserved();
    let total = 500;
    newMessageEmitter.on('event', (id, isSuccess) => {
      if (isSuccess) {
        process.stdout.cursorTo(7);
        process.stdout.write(messages.get(id).toString());
        total = messages.get(id);
        messages.delete(id);
      } else {
        process.stdout.write('/n');
        console.log(`Message proccessing failed`);
        console.log(`Added ${total} records`);
        writeFileSync('./total', total.toString());
        process.exit(1);
      }
    });

    for (let i = 500; i < 500000; i += INCREASE) {
      messages.set(await send(acc, meta, generateMap(i)), i);
    }
    console.log(`Added ${total} records`);
    writeFileSync('./total', total.toString());
    process.exit(0);
  }

  if (cmd === 'state') {
    console.log(await readState());
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
