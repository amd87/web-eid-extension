RELEASE := $(shell grep '"version"' extension/manifest.json  | cut -d'"' -f 4)

# Make the zip to be uploaded to chrome web store
release:
	test ! -f extension-$(RELEASE).zip
	test -z "`git status -s extension`"
	git clean -dfx extension
	zip -r -j extension-$(RELEASE).zip extension
