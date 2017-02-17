module.exports = function(grunt) {
    var manifest = grunt.file.readJSON('extension/manifest.json');

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
       // copy existing
       grunt.file.copy('extension', 'chrome');
       grunt.file.copy('extension', 'firefox');
       
       // modify chrome manifest, removing the mozilla bit
       var manifest = grunt.file.readJSON('chrome/manifest.json');
       
       if ("applications" in manifest)
         delete manifest["applications"];
       grunt.file.write("chrome/manifest.json", JSON.stringify(manifest, null, 2));
    });
    
    grunt.registerTask('default', ['exec:isclean', 'exec:cleanup', 'extensions', 'exec:chrome', 'exec:firefox']);
};
