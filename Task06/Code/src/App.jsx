import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, FileUp, Download, Pencil, Eraser, Type, Trash2, Users, MessageSquare, Send } from 'lucide-react';

const VideoCollabApp = () => {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [files, setFiles] = useState([]);
  const [whiteboardObjects, setWhiteboardObjects] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [participants, setParticipants] = useState([]);
  
  const localVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const peerConnections = useRef({});
  const screenStreamRef = useRef(null);

  // Initialize local media stream
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Could not access camera/microphone. Please grant permissions.');
    }
  };

  useEffect(() => {
    startLocalStream();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Join room
  const joinRoom = () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    setJoined(true);
    setParticipants(['You']);
    addMessage('system', 'You joined the room');
  };

  // Leave room
  const leaveRoom = () => {
    setJoined(false);
    setParticipants([]);
    setPeers({});
    if (screenSharing) {
      stopScreenShare();
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  // Screen sharing
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });
        screenStreamRef.current = screenStream;
        
        // Replace video track with screen track
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          stopScreenShare();
        };
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setScreenSharing(true);
        addMessage('system', 'You started sharing your screen');
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    setScreenSharing(false);
    addMessage('system', 'You stopped sharing your screen');
  };

  // File sharing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileObj = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        timestamp: new Date().toISOString()
      };
      setFiles(prev => [...prev, fileObj]);
      addMessage('system', `File shared: ${file.name}`);
    }
  };

  const downloadFile = (file) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  // Whiteboard functions
  const startDrawing = (e) => {
    if (tool === 'text') return;
    setDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newObj = {
      id: Date.now(),
      type: tool,
      points: [[x, y]],
      color: color,
      width: 2
    };
    setWhiteboardObjects(prev => [...prev, newObj]);
  };

  const draw = (e) => {
    if (!drawing || tool === 'text') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setWhiteboardObjects(prev => {
      const newObjs = [...prev];
      const lastObj = newObjs[newObjs.length - 1];
      if (lastObj && lastObj.id) {
        lastObj.points.push([x, y]);
      }
      return newObjs;
    });
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const addText = (e) => {
    if (tool !== 'text') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const text = prompt('Enter text:');
    if (text) {
      const newObj = {
        id: Date.now(),
        type: 'text',
        content: text,
        x: x,
        y: y,
        color: color,
        fontSize: 16
      };
      setWhiteboardObjects(prev => [...prev, newObj]);
    }
  };

  const clearWhiteboard = () => {
    if (confirm('Clear entire whiteboard?')) {
      setWhiteboardObjects([]);
    }
  };

  // Render whiteboard
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    whiteboardObjects.forEach(obj => {
      if (obj.type === 'pen' || obj.type === 'eraser') {
        ctx.strokeStyle = obj.type === 'eraser' ? '#ffffff' : obj.color;
        ctx.lineWidth = obj.type === 'eraser' ? 20 : obj.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        obj.points.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point[0], point[1]);
          } else {
            ctx.lineTo(point[0], point[1]);
          }
        });
        ctx.stroke();
      } else if (obj.type === 'text') {
        ctx.fillStyle = obj.color;
        ctx.font = `${obj.fontSize}px Arial`;
        ctx.fillText(obj.content, obj.x, obj.y);
      }
    });
  }, [whiteboardObjects]);

  // Chat functions
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    addMessage('You', messageInput);
    setMessageInput('');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">CollabMeet</h1>
            <p className="text-gray-600">Video conferencing made simple</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
            </div>
            
            <button
              onClick={joinRoom}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Join Room
            </button>
            
            <div className="text-center text-sm text-gray-500">
              <p>Or create a random room:</p>
              <button
                onClick={() => {
                  const randomId = Math.random().toString(36).substring(2, 8);
                  setRoomId(randomId);
                }}
                className="text-indigo-600 hover:underline mt-1"
              >
                Generate Room ID
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">CollabMeet</h1>
            <p className="text-gray-400 text-sm">Room: {roomId}</p>
          </div>
        </div>
        
        <button
          onClick={leaveRoom}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Leave Room
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Video grid */}
          <div className="flex-1 bg-gray-900 p-4">
            <div className="h-full grid grid-cols-1 gap-4">
              {/* Local video */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm">
                  You {screenSharing && '(Sharing Screen)'}
                </div>
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                    <VideoOff className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition ${
                  audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {audioEnabled ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-white" />
                )}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition ${
                  videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {videoEnabled ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <VideoOff className="w-6 h-6 text-white" />
                )}
              </button>
              
              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition ${
                  screenSharing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {screenSharing ? (
                  <MonitorOff className="w-6 h-6 text-white" />
                ) : (
                  <Monitor className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'chat'
                  ? 'bg-gray-900 text-white border-b-2 border-indigo-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'files'
                  ? 'bg-gray-900 text-white border-b-2 border-indigo-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileUp className="w-4 h-4 inline mr-2" />
              Files
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'whiteboard'
                  ? 'bg-gray-900 text-white border-b-2 border-indigo-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Pencil className="w-4 h-4 inline mr-2" />
              Board
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'participants'
                  ? 'bg-gray-900 text-white border-b-2 border-indigo-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              People
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={msg.sender === 'system' ? 'text-center' : ''}>
                      {msg.sender === 'system' ? (
                        <p className="text-xs text-gray-500 italic">{msg.text}</p>
                      ) : (
                        <div className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-sm font-medium text-indigo-400">{msg.sender}</span>
                            <span className="text-xs text-gray-500">{msg.timestamp}</span>
                          </div>
                          <p className="text-sm text-white">{msg.text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={sendMessage}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  {files.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <FileUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No files shared yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map(file => (
                        <div key={file.id} className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                              onClick={() => downloadFile(file)}
                              className="ml-2 p-1 text-indigo-400 hover:text-indigo-300"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-700">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <FileUp className="w-4 h-4 inline mr-2" />
                    Upload File
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'whiteboard' && (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setTool('pen')}
                      className={`p-2 rounded ${tool === 'pen' ? 'bg-indigo-600' : 'bg-gray-700'}`}
                    >
                      <Pencil className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setTool('eraser')}
                      className={`p-2 rounded ${tool === 'eraser' ? 'bg-indigo-600' : 'bg-gray-700'}`}
                    >
                      <Eraser className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setTool('text')}
                      className={`p-2 rounded ${tool === 'text' ? 'bg-indigo-600' : 'bg-gray-700'}`}
                    >
                      <Type className="w-4 h-4 text-white" />
                    </button>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <button
                      onClick={clearWhiteboard}
                      className="p-2 rounded bg-red-600 hover:bg-red-700 ml-auto"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={288}
                    height={400}
                    className="bg-white rounded-lg cursor-crosshair w-full"
                    onMouseDown={tool === 'text' ? addText : startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="p-4">
                <h3 className="text-white font-medium mb-3">Participants ({participants.length})</h3>
                <div className="space-y-2">
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{p[0]}</span>
                      </div>
                      <span className="text-white text-sm">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCollabApp;