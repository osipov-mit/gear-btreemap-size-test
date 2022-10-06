#![no_std]

use gstd::{msg, prelude::*, ActorId};
use hashbrown::HashMap;

static mut STATE: Option<Box<HashMap<ActorId, u128>>> = None;

#[no_mangle]
pub unsafe extern "C" fn init() {
    let payload: Vec<(ActorId, u128)> = msg::load().expect("Unable to load message payload");
    let state = STATE.get_or_insert(Box::new(HashMap::default()));
    for (actor, value) in payload.iter() {
        state.insert(*actor, *value);
    }
}

#[no_mangle]
pub unsafe extern "C" fn handle() {
    let payload: Vec<(ActorId, u128)> = msg::load().expect("Unable to load message payload");
    let state = STATE.get_or_insert(Box::new(HashMap::default()));
    for (actor, value) in payload.iter() {
        state.insert(*actor, *value);
    }
}

// #[no_mangle]
// pub unsafe extern "C" fn meta_state() -> *mut [i32; 2] {
//     gstd::util::to_leak_ptr(STATE.get_or_insert(Box::new(BTreeMap::default())).encode())
// }

gstd::metadata! {
    title: "huge-state",
    init:
        input: Vec<(ActorId, u128)>,
    handle:
        input: Vec<(ActorId, u128)>,
    state:
        output: BTreeMap<ActorId, u128>,
}
