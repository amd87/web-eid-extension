module.exports = function(grunt) {
    var manifest = grunt.file.readJSON('extension/manifest.json');
    var keyfile = process.env['HOME'] + '/.mozilla-amo-key.json';
    var amo = grunt.file.exists(keyfile) ? grunt.file.readJSON(keyfile) : {};

    grunt.initConfig({
        exec: {
          isclean: {cmd: 'test -z "`git status -s extension`"'},
          cleanup: {cmd: 'git clean -dfx extension'},
          distdir: {cmd: 'mkdir -p dist'},
          chrome: {
            cwd: "build/chrome",
            cmd: 'zip -r ../../dist/chrome-' + manifest.version + '.zip .'
          },
          firefox: {
            cwd: "build/firefox",
            cmd: 'zip -r ../../dist/firefox-unsigned-' + manifest.version + '.zip .'
          },
          firefoxstore: {
            cwd: "build/firefoxstore",
            cmd: 'zip -r ../../dist/firefox-store-' + manifest.version + '.zip .'
          },
          test: {
            cmd: './node_modules/.bin/addons-linter build/chrome && ./node_modules/.bin/addons-linter build/firefoxstore && ./node_modules/.bin/addons-linter --self-hosted build/firefox'
          },
          sign: {
            cmd: "./node_modules/.bin/web-ext sign -a dist -s build/firefox --api-key " + amo.issuer + " --api-secret " + amo.secret
          }
        }
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.registerTask('extensions', "Generate manifest files", function() {
       // delete existing
       if (grunt.file.isDir('build'))
         grunt.file.delete('build');

       // copy existing
       grunt.file.copy('extension', 'build/chrome');
       grunt.file.copy('extension', 'build/firefox');
       grunt.file.copy('extension', 'build/firefoxstore');
       
       // Small helper for fixing json
       function replace(filename, things) {
         var manifest = grunt.file.readJSON(filename);
         things(manifest);
         grunt.file.write(filename, JSON.stringify(manifest, null, 2));
       }
       // modify chrome manifest, removing the mozilla bit
       replace("build/chrome/manifest.json", function(f) {
         if ("applications" in f)
           delete f["applications"];
       });
       // modify firefox store manifest, removing update_url
       replace("build/firefoxstore/manifest.json", function(f) {
         delete f.applications.gecko["update_url"];
       });
       // modify firefox manifest, changing the store ID to "readable ID"
       replace("build/firefox/manifest.json", function(f) {
         f.applications.gecko["id"] = "native@hwcrypto.org";
       });
    });
    grunt.registerTask('sign', "Sign the FF extension via the API", function() {
       var help = "\nSigning requires AMO signing API keys in " + keyfile;
       help += "\nYou can get the key from https://addons.mozilla.org/developers/addon/api/key/";
       help += "\nThe JSON file should look like this: \n\n" + JSON.stringify({"issuer": "user:x:y", "secret": "hexstring"}, null, 2);

       if (!amo.issuer || !amo.secret) {
         grunt.fail.fatal(help);
       }
       grunt.task.run('exec:isclean');
       grunt.task.run('build');
       grunt.task.run('exec:sign');
    });
    
    grunt.registerTask('build', ['extensions']);
    grunt.registerTask('clean', ['exec:isclean', 'exec:cleanup']);
    grunt.registerTask('dist', ['exec:isclean', 'exec:distdir', 'exec:chrome', 'exec:firefox', 'exec:firefoxstore']);
    grunt.registerTask('default', ['clean', 'build', 'exec:test', 'dist']);
};
