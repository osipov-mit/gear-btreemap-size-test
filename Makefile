build:
	@cargo build --release

upload:
	@./js-side/index.js upload

send:
	@./js-side/index.js send 0x32ee6b715f84ef4752c5fd9b2f75e91acb4aa74cf252020670b89013f5bcb913

state:
	@./js-side/index.js state 0xc3fa4653c7cdb9c25aeecb6eb84061e77592471183d0288c39592ee76c9199bb

.PHONY: build upload send state