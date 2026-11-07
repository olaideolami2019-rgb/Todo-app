let io;

function setSocket(serverIo) {
  io = serverIo;
}

function getSocket() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}

module.exports = { setSocket, getSocket };