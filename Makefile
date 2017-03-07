all: extensions
.DEFAULT:
	grunt $@

clean:
	rm -rf build dist
	git clean -dfx extension

install:
	npm install


release:
	grunt default
	grunt sign
