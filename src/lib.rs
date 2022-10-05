#![no_std]

use gstd::{msg, prelude::*, ActorId, BTreeMap};

static mut STATE: Option<Box<BTreeMap<ActorId, u128>>> = None;

#[no_mangle]
pub unsafe extern "C" fn init() {
    let payload: BTreeMap<ActorId, u128> = msg::load().expect("Unable to load message payload");
    STATE = Some(Box::new(payload));
}

#[no_mangle]
pub unsafe extern "C" fn handle() {
    let payload: BTreeMap<ActorId, u128> = msg::load().expect("Unable to load message payload");
    let state = STATE.get_or_insert(Box::new(BTreeMap::default()));
    for (key, value) in payload.iter() {
        state.insert(*key, *value);
    }
}

#[no_mangle]
pub unsafe extern "C" fn meta_state() -> *mut [i32; 2] {
    gstd::util::to_leak_ptr(STATE.get_or_insert(Box::new(BTreeMap::default())).encode())
}

gstd::metadata! {
    title: "huge-state",
    init:
        input: BTreeMap<ActorId, u128>,
    handle:
        input: BTreeMap<ActorId, u128>,
    state:
        output: BTreeMap<ActorId, u128>,
}
