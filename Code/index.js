'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
//yo-yo-pizza-9jdf.firebaseio.com --> database url ! We can use "https" for accessing our DB but here we use "ws" 
admin.initializeApp({
	credential: admin.credential.applicationDefault(),
  	databaseURL: 'ws://yo-yo-pizza-9jdf.firebaseio.com/'
});
 
process.env.DEBUG = 'dialogflow:debug';  
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
   function welcomeMsg(agent) {
    agent.add(`Welcome to Yo Yo Pizza !!!`);
  }
 
  //this method is called when the chatbot do not understand our response
  function defaultFallback(agent) {
    agent.add(`Sorry, Pardon please`);
    agent.add(`Something wrong with your query , Could you please try again?`);
  }
  
  //details from chatbot will be updated into database
  function checkout(agent){
    const yoyotype ="veg";
    const yoyosize = agent.parameters.yoyosize;
    const yoyotoppings = agent.parameters.yoyotoppings;
    const yoyopizzaname = agent.parameters.yoyopizzaname;
    
    //generating a random 5 digit number that is used as order id
    const orderid = Math.floor((Math.random() * 99999) + 10000);
   
    const yoyocustomername = agent.parameters.name;
    const yoyocustomerphone = agent.parameters.phoneno;
    const yoyocustomeraddress = agent.parameters.address;
       
    agent.add(`Dear ${yoyocustomername} , Your order id is ${orderid}.To track your order, Please type "Order Status"`);  
    //updating data into database
    return admin.database().ref('data').set({
      //the left fields must match database fields !
      yoyo_type: yoyotype,
      yoyo_size: yoyosize,
      yoyo_toppings: yoyotoppings,
      yoyo_pizzaname:yoyopizzaname,
      orderid: orderid,
      name: yoyocustomername,
      mobilenumber : yoyocustomerphone,
      address: yoyocustomeraddress
    });
    
  }
  //using order_id we will track the order details from database.
  function trackbyid(agent){
    //getting order_id from chatbot input i.e., input from user
    const orderid = agent.parameters.orderid;
    return admin.database().ref('data').once('value').then((snapshot)=>{
      //getting required or necessary details from database
    const dbOrderid = snapshot.child('orderid').val();
    const pizza_name = snapshot.child('yoyo_pizzaname').val();
    const pizza_type = snapshot.child('yoyo_type').val();
    const customer_name = snapshot.child('name').val();
      //checking if the order id obtained from user exists in the database , if yes we will print the details else we will print a msg to try again
      if(dbOrderid==orderid){
       agent.add(`Your ${pizza_name} pizza preparation started.Order will be delievered within 45 minutes. Thank you ${customer_name} for ordering from YO-YO-PIZZA !!!`);
      }
      else 
        agent.add(`Oops! By mistake your order got cancelled. Please give order again ! Thank you`);
        
    });
  }
  //mapping fulfillment with intents
  let intent = new Map();
  intent.set('Default Fallback Intent', defaultFallback);
  intent.set('yoyo-customerdetails', checkout);
  intent.set('yoyo-orderstatus', trackbyid);
  agent.handleRequest(intent);
});