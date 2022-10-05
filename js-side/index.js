#!/usr/bin/env node

import { GearApi, getWasmMetadata, GearKeyring, CreateType } from '@gear-js/api';
import EventEmitter from 'events';
import { readFileSync, writeFileSync } from 'fs';

const HANDLE_RECORDS = Number(process.env.HANDLE_RECORDS || '10');
const INIT_RECORDS = Number(process.env.INIT_RECORDS || '500');
const metaPath = process.env.META_PATH || './target/wasm32-unknown-unknown/release/btreemap_size_test.meta.wasm';
const optPath = process.env.OPT_PATH || './target/wasm32-unknown-unknown/release/btreemap_size_test.opt.wasm';

const cmd = process.argv[2];
const programId = process.argv[3];

const api = new GearApi();
const metaWasm = readFileSync(metaPath);
const newMessageEmitter = new EventEmitter();

function generateMap(from, to) {
  const map = {};
  for (let i = from; i < from + (to || HANDLE_RECORDS); i++) {
    map[CreateType.create('u256', i).toHex()] = i * 12345;
  }
  return map;
}

function listenToMessagesDispatched() {
  api.gearEvents.subscribeToGearEvent('MessagesDispatched', (event) => {
    event.data.statuses.forEach((value, key) => {
      setTimeout(() => {
        newMessageEmitter.emit('dispatched', key.toHex(), value.isSuccess);
      }, 1000);
    });
  });
}

async function upload(acc, meta) {
  const optWasm = readFileSync(optPath);

  const { programId } = api.program.upload(
    { code: optWasm, initPayload: generateMap(0, INIT_RECORDS), gasLimit: api.blockGasLimit },
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
        if (method === 'MessageEnqueued') {
          resolve(data.id.toHex());
        } else if (method === 'ExtrinsicFailed') {
          reject(api.getExtrinsicFailedError(event));
        }
      });
    }),
  );
}

async function main() {
  await api.isReady;
  const meta = await getWasmMetadata(metaWasm);
  const acc = await GearKeyring.fromSuri('//Alice');

  if (cmd === 'upload') {
    console.log(await upload(acc, meta));
  }

  if (cmd === 'send') {
    const messages = new Map();
    listenToMessagesDispatched();

    let total = INIT_RECORDS;

    console.log(`Total: ${total}\n`);
    newMessageEmitter.on('dispatched', (id, isSuccess) => {
      if (isSuccess) {
        console.log(`Total: ${messages.get(id).toString()}\n`);
        total = messages.get(id);
        messages.delete(id);
      } else {
        console.log(`Message proccessing failed\n`);
        console.log(`Added ${total} records\n`);
        writeFileSync('./total', total.toString());
        process.exit(1);
      }
    });

    for (let i = INIT_RECORDS; i < 500000; i += HANDLE_RECORDS) {
      messages.set(await send(acc, meta, generateMap(i)), i + HANDLE_RECORDS);
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });

    console.log(`Added ${total} records`);
    writeFileSync('./total', total.toString());
    process.exit(0);
  }

  if (cmd === 'state') {
    console.log(await readState());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
