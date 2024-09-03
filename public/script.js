const chatbox = document.getElementById('chatbox');
const toInput = document.getElementById('toInput');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const fileInput = document.getElementById('fileInput');
const inboxButton = document.getElementById('inboxButton');
const inbox = document.getElementById('inbox');
const chatContainer = document.getElementById('chatContainer');

// Function to send a message
function sendMessage() {
    const recipientNumber = toInput.value;
    const message = messageInput.value;
    const file = fileInput.files[0];

    if (!recipientNumber || !/^\+?[1-9]\d{1,14}$/.test(recipientNumber)) {
        alert('Please enter a valid recipient number in E.164 format.');
        return;
    }

    if (!message && !file) {
        alert('Please enter a message or select a file.');
        return;
    }

    const formData = new FormData();
    formData.append('to', recipientNumber);
    formData.append('message', message);
    if (file) {
        formData.append('file', file);
    }

    // Send the message using AJAX
    fetch('/send-sms', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json()) 
    .then(data => {
        console.log(data);
        const messageType = 'sent'; // Assuming message type for sent messages
        displayMessage(data.message, messageType, data.fileUrl); // Use the message and fileUrl
        // Clear inputs
        messageInput.value = '';
        fileInput.value = '';
        toInput.value = '';
    })
    .catch(error => {
        console.error('Error sending message:', error);
    });
}

// Function to display messages in the chatbox
function displayMessage(message, type, fileUrl = null) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);

    // Create a message content element
    const messageContent = document.createElement('div');
    messageContent.innerText = message; // Set the text of the message
    // Append the message content to the message element
    messageElement.appendChild(messageContent);

    // Check if a file URL is provided and create the appropriate preview
    if (fileUrl) {
        let fileElement;

        // Determine the file type and create the appropriate preview
        const fileExtension = fileUrl.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            // Image file
            fileElement = document.createElement('img');
            fileElement.src = fileUrl;
            fileElement.alt = 'Image preview';
            fileElement.style.maxWidth = '200px'; // Limit image size
            fileElement.style.borderRadius = '10px';
            fileElement.style.marginTop = '5px';
        } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
            // Audio file
            fileElement = document.createElement('audio');
            fileElement.controls = true; // Show audio controls
            fileElement.src = fileUrl;
            fileElement.style.marginTop = '5px';
        } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
            // Video file
            fileElement = document.createElement('video');
            fileElement.controls = true; // Show video controls
            fileElement.src = fileUrl;
            fileElement.style.maxWidth = '200px'; // Limit video size
            fileElement.style.borderRadius = '10px';
            fileElement.style.marginTop = '5px';
        }
        
        // Append the file preview element to the message element
        if (fileElement) {
            messageElement.appendChild(fileElement);
        }
    }

    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight; // Scroll to the bottom
}

// A Set to keep track of displayed message IDs
const displayedMessageIds = new Set();

function fetchMessages() {
    fetch('/fetch-sms') // This endpoint needs to be implemented on the server
        .then(response => response.json())
        .then(messages => {
            messages.forEach(msg => {
                // Check if the message ID has already been displayed
                if (!displayedMessageIds.has(msg.id) && msg.type == 'received') {
                    displayMessage(msg.body, 'received');
                    // Add the message ID to the set
                    displayedMessageIds.add(msg.id);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
        });
}

// Poll for new messages every 2 seconds
setInterval(fetchMessages, 2000);

// Event listener for the send button
sendButton.addEventListener('click', sendMessage);

// // Event listener for the inbox button
// inboxButton.addEventListener('click', () => {
//     // Toggle the display of the inbox
//     if (inbox.style.display === 'none' || inbox.style.display === '') {
//         inbox.style.display = 'block'; // Show inbox
//         chatContainer.style.marginLeft = '33.33%'; // Push chat container
//     } else {
//         inbox.style.display = 'none'; // Hide inbox
//         chatContainer.style.marginLeft = '0'; // Reset margin
//     }
// });