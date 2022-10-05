#![no_std]

use gstd::{msg, prelude::*, ActorId};

static mut STATE: Option<BTreeMap<ActorId, u128>> = None;

#[no_mangle]
pub unsafe extern "C" fn init() {
    let payload: BTreeMap<ActorId, u128> = msg::load().expect("Unable to load message payload");
    STATE = Some(payload);
}

#[no_mangle]
pub unsafe extern "C" fn handle() {
    let payload: BTreeMap<ActorId, u128> = msg::load().expect("Unable to load message payload");
    let state = STATE.get_or_insert(BTreeMap::default());
    for (key, value) in payload.iter() {
        state.insert(*key, *value);
    }
    // state.extend(payload);
    // msg::reply("ok", 0);
}

#[no_mangle]
pub unsafe extern "C" fn meta_state() -> *mut [i32; 2] {
    gstd::util::to_leak_ptr(STATE.encode())
}

gstd::metadata! {
    title: "huge-state",
    init:
        input: BTreeMap<ActorId, u128>,
    handle:
        input: BTreeMap<ActorId, u128>,
    state:
        output: Option<BTreeMap<ActorId, u128>>,
}
