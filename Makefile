build:
	@cargo build --release

upload:
	@INIT_RECORDS=50 OPT_PATH=btreemap_size_test.opt.wasm META_PATH=btreemap_size_test.meta.wasm ./js-side/index.js upload

send:
	@HANDLE_RECORDS=50 INIT_RECORDS=3000 META_PATH=btreemap_size_test.meta.wasm ./js-side/index.js send 0x894ad50e07d22a003f2a5629f743c9566ec1f9dda37242c0b15735304346be17

state:
	@./js-side/index.js state 0x894ad50e07d22a003f2a5629f743c9566ec1f9dda37242c0b15735304346be17


.PHONY: build upload send state