let APP_ID ="72771613fd474bd0bb702ca5fd00db58"


let peerConnection;
let localStream;
let remoteStream;

let uid = String(Math.floor(Math.random() * 10000))
let token = null;
let client;

let servers = {
    iceServers:[
        {
            urls:['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
}

let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid, token})

    const channel = client.createChannel('main')
    channel.join() 

    channel.on ('MemberJoined', handlePeerJoined)
    client.on('MessageFromPeer', handledMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    document.getElementById('user-1').srcObject = localStream
}

let handlePeerJoined = async (MemberID) => {
    console.log('A new peer as join thhis room: '), MemberID
    createOffer(MemberID)

}

let handledMessageFromPeer = async (message, MemberID) => {
    message = JSON.parse(message.text)
    console.log('Message', message.type)

    if(message.type == 'offer'){
        document.getElementById('offer-sdp').value = JSON.stringify(message.offer)
        createAnswer(MemberID)
    }

    if(message.type === 'candidate' ){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let createPeerConnection = async (sdptype, MemberID) => {   
    peerConnection = new RTCPeerConnection(servers)
    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').srcObject = localStream
    
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate){
            document.getElementById(sdptype).value = JSON.stringify(peerConnection.localDescription)
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberID)
        }
    }
}

let createOffer = async (MemberID) => {
    
    createPeerConnection('offer-sdp', MemberID)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    document.getElementById('offer-sdp').value = JSON.stringify(offer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberID)
}

let createAnswer = async (MemberID) => {
    createPeerConnection('answer-sdp', MemberID)

    let offer = document.getElementById('offer-sdp').value 
    if(!offer) return alert('Retrieve offer from peer firts...')

    offer = JSON.parse(offer)
    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    document.getElementById('answer-sdp').value = JSON.stringify(answer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberID)
}

let addAnswer = async () => {
    let answer = document.getElementById('answer-sdp').value
    if(!answer) return alert('Retrieve answer from peer firts...')

    answer = JSON.parse(answer)

    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }

} 

init()


//document.getElementById('create-offer').addEventListener('click', createOffer)
//document.getElementById('create-answer').addEventListener('click', createAnswer)
//document.getElementById('add-answer').addEventListener('click', addAnswer)