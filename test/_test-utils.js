module.exports = ({http, micro, listen}) => ({
	getUrl: fn => listen(new http.Server(micro(fn)))
});
