all: default
.DEFAULT:
	grunt $@

clean:
	rm -rf build dist
	git clean -dfx extension

install:
	npm install
