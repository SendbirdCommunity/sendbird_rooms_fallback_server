const express  = require("express");
var axios = require('axios');
const base64 = require('base-64');
const app = express()

const APP_ID = 'YOUR_APP_ID'
const API_TOKEN = 'YOUR_API_TOKEN'

app.get('/', async function (req, res) {

    const data = await buildData("swid_29394959594939XX")
    const urlAsBase64 = `https://yourwebsite.com?data=${base64.encode(JSON.stringify(data))}`
    res.send(urlAsBase64)
})

//Attempt to fetch a new token for the target user.
const fetchNewSendBirdSessionToken = async (userId) => {


    const config = {
        method: 'post',
        url: `https://api-${APP_ID}.sendbird.com/v3/users/${userId}/token`,
        headers: {
            'Api-Token': API_TOKEN
        },
        data: JSON.stringify({expires_at: Date.now() + 1000 * 60 * 10})
    };
    try {
        const result = await axios(config)
        return {
            error: false,
            creds: result.data
        }

    } catch (e) {
        return {
            error: true,
            message: JSON.stringify(e.response.data)
        }
    }
}

//Create a new users if one doesn't exist.
const createNewSendbirdUser = async (userId) => {

    const config = {
        method: 'post',
        url: `https://api-${APP_ID}.sendbird.com/v3/users`,
        headers: {
            'Api-Token': API_TOKEN
        },
        data: JSON.stringify({
            user_id: userId,
            nickname: "",
            profile_url: ""
        })
    };
    try {
        const result = await axios(config)
        return {error: false, data: result.data}
    } catch (e) {
        return {error: true, message: JSON.stringify(e.response.data)}
    }

}

//Create a room
const createNewSendbirdGroupCallRoom = async () => {

    const config = {
        method: 'post',
        url: `https://api-${APP_ID}.calls.sendbird.com/v1/rooms`,
        headers: {
            'Api-Token': API_TOKEN
        },
        data: JSON.stringify({type: "small_room_for_video"})
    };
    try {
        const result = await axios(config)
        return {error: false, data: result.data}
    } catch (e) {
        return {error: true, message: JSON.stringify(e.response.data)}
    }
}


const buildData = async (userId) => {
    const data = {
        "service_user_id": userId,
        "room_id":  null,
        "app_id": APP_ID,
        "creds": {
            "token": null,
            "expires_at": null
        }
    }

    try {
        const userCredentials = await fetchNewSendBirdSessionToken(userId)
        // if (userCredentials.error) return userCredentials

        if(userCredentials.creds) {
            //Create a new room
            data.creds = userCredentials.creds
        } else if (userCredentials.message == "{\"error\":true,\"message\":\"\\\"User\\\" not found.\",\"code\":400201}") {

            const newUser = await createNewSendbirdUser(userId)
            if (newUser.error) return newUser

            if(newUser.data) {

            const userCredentials = await fetchNewSendBirdSessionToken(userId)

                if (userCredentials.error) return userCredentials

                if(userCredentials.creds){
                    data.creds = userCredentials.creds
                }
            }
        }

        const newRoom = await createNewSendbirdGroupCallRoom ()
        data.room_id = newRoom.data.room.room_id
        return data
    } catch (e) {
        return e
    }

}


app.listen(3001,() => {
    console.log("server started on port 3001")
} )
