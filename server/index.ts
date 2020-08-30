import IO from 'socket.io';

IO(4000).on('connection', (socket) => {
  socket.on('JOIN', (userName: string) => {
    socket.emit('JOINED', userName);
  });
});
