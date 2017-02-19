module.exports = function(grunt) {
    var manifest = grunt.file.readJSON('extension/manifest.json');
    var keyfile = process.env['HOME'] + '/.mozilla-amo-key.json';
    var amo = grunt.file.exists(keyfile) ? grunt.file.readJSON(keyfile) : {};

    grunt.initConfig({
        exec: {
          isclean: {cmd: 'test -z "`git status -s extension`"'},
          cleanup: {cmd: 'git clean -dfx extension'},
          chrome: {
            cwd: "chrome",
            cmd: 'zip -r ../chrome-' + manifest.version + '.zip .'
          },
          firefox: {
            cwd: "firefox",
            cmd: 'zip -r ../firefox-' + manifest.version + '.zip .'
          },
          firefoxstore: {
            cwd: "firefoxstore",
            cmd: 'zip -r ../firefoxstore-' + manifest.version + '.zip .'
          },
          sign: {
            cmd: "./node_modules/.bin/web-ext sign -a . -s firefox --api-key " + amo.issuer + " --api-secret " + amo.secret
          }
        }
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.registerTask('extensions', "Generate manifest files", function() {
       // delete existing
       if (grunt.file.isDir('chrome'))
         grunt.file.delete('chrome');
       if (grunt.file.isDir('firefox'))
         grunt.file.delete('firefox')
       if (grunt.file.isDir('firefoxstore'))
         grunt.file.delete('firefoxstore');

       // copy existing
       grunt.file.copy('extension', 'chrome');
       grunt.file.copy('extension', 'firefox');
       grunt.file.copy('extension', 'firefoxstore');
       
       // modify chrome manifest, removing the mozilla bit
       var chrome_manifest = grunt.file.readJSON('chrome/manifest.json');
       if ("applications" in manifest)
         delete manifest["applications"];
       grunt.file.write("chrome/manifest.json", JSON.stringify(chrome_manifest, null, 2));

       // modify firefox store manifest, removing update_url
       var ff_store_manifest = grunt.file.readJSON('firefoxstore/manifest.json');
       delete ff_store_manifest.applications.gecko["update_url"];
       grunt.file.write("firefoxstore/manifest.json", JSON.stringify(ff_store_manifest, null, 2));
    });
    grunt.registerTask('sign', "Sign the FF extension via the API", function() {
       var help = "\nSigning requires AMO signing API keys in " + keyfile;
       help += "\nYou can get the key from https://addons.mozilla.org/developers/addon/api/key/";
       help += "\nThe JSON file should look like this: \n\n" + JSON.stringify({"issuer": "user:x:y", "secret": "hexstring"}, null, 2);

       if (!amo.issuer || !amo.secret) {
         grunt.fail.fatal(help);
       }
       grunt.task.run('build');
       grunt.task.run('exec:sign');
    });
    
    grunt.registerTask('build', ['extensions']);
    grunt.registerTask('clean', ['exec:isclean', 'exec:cleanup']);
    grunt.registerTask('dist', ['exec:isclean', 'exec:chrome', 'exec:firefox', 'exec:firefoxstore']);
    grunt.registerTask('default', ['clean', 'build', 'dist']);
};
