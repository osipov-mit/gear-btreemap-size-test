build:
	@cargo build --release

upload:
	@./js-side/index.js upload

send:
	@./js-side/index.js send 0x6a91e1bc08930d78d9c20a9ee29db284509906bc254a17bbd0eba4df5bc803ee

state:
	@./js-side/index.js state 0x6a91e1bc08930d78d9c20a9ee29db284509906bc254a17bbd0eba4df5bc803ee


.PHONY: build upload send state