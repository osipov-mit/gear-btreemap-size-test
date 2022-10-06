build:
	@cargo build --release

upload:
	@OPT_PATH=btreemap_size_test.opt.wasm META_PATH=btreemap_size_test.meta.wasm ./js-side/index.js upload

send:
	@HANDLE_SIZE=1 META_PATH=btreemap_size_test.meta.wasm ./js-side/index.js send 0xb627069221eda05a92f839a2a9ca8229c9f56357bad3007d96660449608f7342

state:
	@./js-side/index.js state 0xa5996bd3229244cf96551af553a449c00bd885a5b75b72b4e1030419bbeae00d


.PHONY: build upload send state