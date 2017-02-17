RELEASE := $(shell grep '"version"' extension/manifest.json  | cut -d'"' -f 4)

# Make the zip to be uploaded to chrome web store
release:
	test ! -f extension-$(RELEASE).zip
	test -z "`git status -s extension`"
	git clean -dfx extension
	(cd extension && zip -r ../extension-$(RELEASE).zip .)

# Sign Firefox extension
# Go to https://addons.mozilla.org/en-US/developers/addon/api/key/ and
# copy the valus to ~/.mozilla-amo-key like this:
# ISSUER=XXX
# SECRET=XXX

include ~/.mozilla-amo-key
sign:
	web-ext -s extension sign --api-key $(ISSUER) --api-secret $(SECRET)
