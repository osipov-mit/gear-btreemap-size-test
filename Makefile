build:
	@cargo build --release

upload:
	@./js-side/index.js upload

send:
	@./js-side/index.js send 0xb627069221eda05a92f839a2a9ca8229c9f56357bad3007d96660449608f7342

state:
	@./js-side/index.js state 0xa5996bd3229244cf96551af553a449c00bd885a5b75b72b4e1030419bbeae00d


.PHONY: build upload send state