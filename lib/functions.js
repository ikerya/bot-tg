exports.sleep = function sleep(seconds) {
    return seconds ? 
        new Promise(resolve => 
            setTimeout(resolve, seconds * 1000)
        ):
        Promise.resolve();
};