VERSION = $(shell grep \"version\" extension/manifest.json | cut -d'"' -f 4)
all: extensions
.DEFAULT:
	grunt $@

clean:
	rm -rf build dist
	git clean -dfx extension

install:
	npm install


release:
	@echo "About to release $(VERSION)"
	# Check that code is up to date
	git checkout master
	git pull --rebase --tags
	# Check that version tag does not exist
	! git tag -l | grep $(VERSION)
	# tag release
	git tag -s $(VERSION) -m "Release $(VERSION)"
	grunt default
	grunt sign
	# Be sure to push everyting back
	git push --tags origin master
	
