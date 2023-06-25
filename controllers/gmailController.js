const { google } = require('googleapis');

//adding a label name called 'vacation' for moving the replied mails.
const LABEL_NAME = 'vacation';

async function getUnrepliedMessages(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: '-in:chats -from:me -has:userlabels',
    });
    return res.data.messages || [];
}

async function sendReply(auth, message) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From'],
    });


    const sub = res.data.payload.headers.find(
        (header) => header.name === 'Subject'
    ).value;
    const from = res.data.payload.headers.find(
        (header) => header.name === 'From'
    ).value;
    let fromArr = from.split(' ');


    const replyTo = from.match(/<(.*)>/)[1];
    const replySubject = sub.startsWith('Re:') ? sub : `Re: ${sub}`; 
    const replyBody = `
Dear ${fromArr[0] + ' ' + fromArr[1]},

Thank you for your email. This is an automated reply.
`;

    const rawMessage = [
        `From: me`,
        `To: ${replyTo}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${message.id}`,
        `References: ${message.id}`,
        '',
        replyBody,
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage,
        },
    });
}

async function createLabel(auth) {
    const gmail = google.gmail({ version: 'v1', auth });

    try {
        const res = await gmail.users.labels.create({
            userId: 'me',
            requestBody: {
                name: LABEL_NAME,
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show',
            },
        });
        return res.data.id;
    } catch (err) {
        if (err.code === 409) {
            // Label already exists
            const res = await gmail.users.labels.list({
                userId: 'me',
            });
            const label = res.data.labels.find((label) => label.name === LABEL_NAME);
            return label.id;
        } else {
            throw err;
        }
    }
}

async function addLabel(auth, message, labelId) {
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.messages.modify({
        userId: 'me',
        id: message.id,
        requestBody: {
            addLabelIds: [labelId],
            removeLabelIds: ['INBOX'],
        },
    });
}

async function main(auth) {
    // Create a label for the app
    const labelId = await createLabel(auth);
    console.log(`${LABEL_NAME} label is created/already exists.`);


    // Repeat the following steps in random intervals
    setInterval(async () => {
        // Get messages that have no prior replies
        const messages = await getUnrepliedMessages(auth);
        console.log(`Found ${messages.length} unreplied messages`);

        // For every mail
        for (const message of messages) {
            // Sending  reply to the email
            await sendReply(auth, message);
            console.log(`Sent reply to message with id ${message.id}`);

            // Add label to the message and move it to the label folder
            await addLabel(auth, message, labelId);
            console.log(`Added label to message with id ${message.id}`);
        }
        // Respomding to emails every 45 and 120 seconds
    }, 5000 ); 
}

module.exports = {
    getUnrepliedMessages,
    sendReply,
    createLabel,
    addLabel,
    main,
};