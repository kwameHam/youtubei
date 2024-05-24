const delay = (ms) => {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}

exports.delay = delay
