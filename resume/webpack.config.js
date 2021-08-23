const path = require('path');

module.exports = {
    entry: {
        elkjs: {
            import: 'elkjs/lib/elk.bundled.js',
            library: {
                // all options under `output.library` can be used here
                name: 'ELK',
                type: 'umd',
                
            },
        },
        index: {
            import: './src/index.js',
            library: {
                // all options under `output.library` can be used here
                name: 'visModule',
                type: 'umd',
                
            },
            dependOn: ['elkjs']
        }
    },
    mode: 'development',
    devtool : 'eval',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
    }
};