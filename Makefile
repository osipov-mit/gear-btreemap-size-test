build:
	@cargo build --release

upload:
	@./js-side/index.js upload

send:
	@./js-side/index.js send 0xc3fa4653c7cdb9c25aeecb6eb84061e77592471183d0288c39592ee76c9199bb

state:
	@./js-side/index.js state 0xc3fa4653c7cdb9c25aeecb6eb84061e77592471183d0288c39592ee76c9199bb

.PHONY: build upload send state