module.exports = function startServer(io) {
	io.on('connection', socket => {
		console.log('a user connected');

		socket.on('disconnect', () => {
			console.log('user disconnected');
		});

		socket.on('chat message', msg => {
			console.log(`message: ${msg}`);
			io.emit('chat message', msg);
		});
	});
};
