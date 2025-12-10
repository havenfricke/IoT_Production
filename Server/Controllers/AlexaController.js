// Server/Controllers/AlexaController.js

const BaseController = require('../Utils/BaseController');
const dataService = require('../Services/GyroDataService');

const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');

class AlexaController extends BaseController {
  constructor() {
    // Mount at /alexa
    super('/alexa');
    this.router
        
    // ─────────────────────────────────────────────
    // Intent Handlers (your skill code)
    // ─────────────────────────────────────────────

    // Added rest of basic intents --Aidan
    const LaunchRequestHandler = {
      canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
      },
      handle(handlerInput) {
        const speakOutput =
          'Welcome, you can say Hello, Test, or ask for sensor data. Which would you like to try?';

        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(speakOutput)
          .getResponse();
      },
    };

    // Single intent handler example that uses your DataService
    const RandomSensorDataIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'RandomSensorDataIntent'
        );
      },
      async handle(handlerInput) {
        try {

          // Pull all data rows from your DB via DataService
          const rows = await dataService.getAllData();

          if (!rows || rows.length === 0) {
            const speakOutput = 'There is currently no sensor data available.';
            return handlerInput.responseBuilder.speak(speakOutput).getResponse();
          }

          // Pick a random row
          const randomIndex = Math.floor(Math.random() * rows.length);
          const row = rows[randomIndex];

          const speakOutput =
            'Here is all the data sir. ' +
            `Sensor with device ID ${row.deviceId} distance of ${row.distanceCm}, 
            pitch of ${row.pitchDeg}, roll of ${row.rollDeg}, and yaw of ${row.yawDeg}.`;

          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        } catch (err) {
          console.error('RandomSensorDataIntent error:', err);
          const speakOutput =
            'Sorry, I had trouble getting your sensor data. Please try again later.';

          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        }
      },
    };

    const HelloWorldIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent'
        );
      },
      handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder.speak(speakOutput).getResponse();
      },
    };

    // Testing new intentHandler
    const TestIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'TestIntent'
        );
      },
      handle(handlerInput) {
        const speakOutput = 'This is a test intent. Everything is working correctly!';

        return handlerInput.responseBuilder.speak(speakOutput).getResponse();
      },
    };

    const HelpIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
        );
      },
      handle(handlerInput) {
        const speakOutput = 'You can say hello, test, or ask for a random sensor reading.';

        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      },
    };

    const CancelAndStopIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
        );
      },
      handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder.speak(speakOutput).getResponse();
      },
    };

    const FallbackIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
        );
      },
      handle(handlerInput) {
        const speakOutput = "Sorry, I don't know about that. Please try again.";

        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
      },
    };

    const SessionEndedRequestHandler = {
      canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
      },
      handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // empty response
      },
    };

    const IntentReflectorHandler = {
      canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
      },
      handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder.speak(speakOutput).getResponse();
      },
    };

    // Basic error handler for Alexa
    const ErrorHandler = {
      canHandle() {
        return true;
      },
      handle(handlerInput, error) {
        console.error('Alexa Skill Error:', error);
        const speakOutput =
          'Sorry, something went wrong handling your request. Please try again.';

        return handlerInput.responseBuilder.speak(speakOutput).getResponse();
      },
    };


    // Build the Alexa skill 
    const skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        RandomSensorDataIntentHandler,
        HelloWorldIntentHandler,
        TestIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
      )
      .addErrorHandlers(ErrorHandler)
      .withCustomUserAgent('aws-production/iot-skill/v1')
      .create();

    // Hook the skill into Express
    const alexaAdapter = new ExpressAdapter(skill, false, false);

    // POST /alexa  (this is the endpoint you set in the Alexa console)
    this.router.post('', alexaAdapter.getRequestHandlers());

    // Optional: simple GET to confirm the endpoint is up in a browser
    this.router.get('', (req, res) => {
      res.send('Alexa endpoint is alive. Use POST (from Alexa) to talk to it.');
    });
  }
}

module.exports = AlexaController;
