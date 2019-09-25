//RTM//
const { RTMClient } = require('@slack/rtm-api');
const token = 'token';
const rtm = new RTMClient(token);
//MongoDB//
const MongoClient = require("mongodb").MongoClient; 
const objectId = require('mongodb').ObjectID; 
const url = 'mongodb://localhost:27017/'; 
const mongoClient = new MongoClient(url, { useNewUrlParser: true }, { useUndifiedTopology: true});
mongoClient.connect(function(err, client){
    if(err){
        return console.log(err);
    }
    dbClient = client; 
    app.locals.collection = client.db('userdb').collection('users');
});
//Express//
const express = require('express');
const app = express(); 
const jsonparser = express.json(); 
app.listen(5000, function(req, res){
    console.log('Ожидание подключения...');
});

let dbClient; 
app.use(express.static(__dirname + '/public')); 
//Order//
app.get('/api/users', function(req, res){
    const collection = req.app.locals.collection;
    collection.find({}).toArray(function(err, users){
        if (err){
            return console.log(err); 
        }
        res.send(users); 
    });
});

app.get("/api/users/:id", function(req, res){
    const id = new objectId(req.params.id);
    const collection = req.app.locals.collection;
    collection.findOne({_id: id}, function(err, user){
        if(err){
            console.log(err);
        }
        res.send(user); 
    });
});

process.on("SIGINT", () => {
    dbClient.close();
    process.exit();
});
//WEB//
const { WebClient } = require('@slack/web-api');
const web = new WebClient(token);
//Interactive messages //
const {createMessageAdapter} = require('@slack/interactive-messages'); 
const slackSignSecret = 'secret'; 
const slackInteractions = createMessageAdapter(slackSignSecret);
const port = process.env.PORT || 3000; 
//Vibor picci 
let pizzaName;
slackInteractions.action({ type: 'button' }, (payload, respond) => {
    //openDialog(payload.trigger_id, payload.actions[0].value);
    pizzaName = payload.actions[0].value; 
    const triggerId = payload.trigger_id; 
    (async () =>{
        if (pizzaName === 'Неаполетано'){
            pizzaName = 'Неаполетано';
        }else if (pizzaName == 'Четыресезона'){
            pizzaName = 'ЧетыреCезона';
        }else if (pizzaName === 'Падана'){ 
            pizzaName = 'Падана';
        }
    //console.log(pizzaName);
    const result = await web.dialog.open({
        trigger_id: triggerId, 
        dialog: { 
            callback_id: 'getOrder',
            title: `Заказ пиццы ${pizzaName}`,
            submit_label: 'Request',
            elements: [
                {
                    type: 'select',
                    label: 'Размер пиццы',
                    placeholder: 'Выберите размер пиццы',
                    name: 'pizzaSize',
                    options: [
                        {
                            label: 'Маленький(25см)',
                            value: 'small'
                        },
                        {
                            label: 'Средний(35см)',
                            value: 'middle'
                        },
                        {
                            label: 'Большая(45см)',
                            value: 'big'
                        }
                    ]
                },
                {
                    type: 'text',
                    label: 'Адрес',
                    name: 'adress',
                    hint: 'Введите свой адрес'
                },
                {
                    type: 'text',
                    label: 'Номер телефона', 
                    name: 'phone',
                    subtype: 'tel',
                    hint: 'Введите свой номер телефона'
                }
            ]
        }
    });
    })();
});

//Submit a Dialogue//
slackInteractions.action({ type: 'dialog_submission' }, (payload, respond) => {
    console.log('PAYLOAD: ', payload);

    mongoClient.connect(function(err, client) {
        if (err) return console.log(err);
        const db = client.db('usersdb');
        const collection = db.collection('users');

        if (pizzaName === 'Неаполетано'){
            pizzaName = 'Неаполетано';
        }else if (pizzaName == 'Четыресезона'){
            pizzaName = 'ЧетыреCезона';
        }else if (pizzaName === 'Падана'){ 
            pizzaName = 'Падана';
        }

        if (payload.submission.pizzaSize === 'small') {
            payload.submission.pizzaSize = 'Маленькая';
        }
        else if (payload.submission.pizzaSize === 'middle') {
            payload.submission.pizzaSize = 'Средняя';
        }
        else if (payload.submission.pizzaSize === 'big') {
            payload.submission.pizzaSize = 'Большая';
        }

//Writing An Order To The Database//
        let user = {pizzaName: pizzaName, size: payload.submission.pizzaSize, address: payload.submission.adress, phone: payload.submission.phone};
        collection.insertOne(user, function(err, results){
            client.close();
        });
    
//Search For Items In The Database//
        collection.find().toArray(function(err, results){
                 
            console.log(results);
            client.close();
        });
    });

//Message After Order Confirmation In The Dialog Box//
    const result = web.chat.postMessage({
        channel: 'CNDR184P2',
        text: 'Заказ принят <@' + payload.user.name + '>, ожидайте звонка, для подтверждения заказа.'
    });
});

rtm.on('message', async (data) =>{
    data.text = data.text.toUpperCase();
    if (data.text === 'ПИЦЦА' || data.text == 'PIZZA'){
        try { 
            const result = await web.chat.postMessage({
                channel: 'CNDR184P2',
                blocks: [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "Здравствуйте, я ваш помощник на сегодня! *WhitePBot* хочет знать какую пиццу вы хотели бы заказать.\n\n *Пожалуйста, выбрете пиццу:*"
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Неаполетано(Napoletana)*\n:star::star::star::star: 1528 reviews\n Состав: томатный соус, грибы, анчоусы, орегано, моцарелла! "
                        },
                        "accessory": {
                            "type": "image",
                            "image_url": "https://pp.userapi.com/c831408/v831408753/11135d/FGruXEGkCUE.jpg",
                            "alt_text": "alt text for image"
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Четыре сезона (Quattro Stagioni)*\n:star::star::star::star: 1638 reviews\n Состав: томатный соус, моцарелла, грибы, ветчина, артишоки, оливки и орегано."
                        },
                        "accessory": {
                            "type": "image",
                            "image_url": "https://bowling.turbina.ua/rovno/wp-content/uploads/sites/6/2017/06/pizza_4_sezona.jpg",
                            "alt_text": "alt text for image"
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Падана (Padana)*\n:star::star::star::star: 2082 reviews\n Состав:Томатный соус, сыр пармезан, салями, цуккини и полента (отварная кукурузная мука)."
                        },
                        "accessory": {
                            "type": "image",
                            "image_url": "https://pp.userapi.com/c831408/v831408753/11135d/FGruXEGkCUE.jpg",
                            "alt_text": "alt text for image"
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "Неаполетано",
                                    "emoji": true
                                },
                                "value": "Неаполетано"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "Четыре сезона ",
                                    "emoji": true
                                },
                                "value": "Четыресезона"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "Падана",
                                    "emoji": true
                                },
                                "value": "Падана"
                            }
                        ]
                    }
                ]
            });
        }catch(error){
            console.log('An error occurred', error);
        }
    }
    (async () => {
        await rtm.start();
    });
});

(async () => {
    const server = await slackInteractions.start(port);
    console.log(`Listening for events on ${server.address().port}`);

    await rtm.start();   
    console.log('Bot Enabled');

    await web.chat.postMessage({
        channel: 'CNDR184P2',
        text: 'Здравствуйте, для заказа пиццы, напишите "Пицца" или "Pizza"'
    });
})();