// Server/Controllers/AlexaController.js

const BaseController = require('../Utils/BaseController');
const dataService = require('../Services/DataService');
// const gyroDataService = require('../Services/GyroDataService');
// const lidarDataService = require('../Services/LidarDataService');

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
          // const lidarRows = await lidarDataService.getAllData();
          // const gyroRows = await gyroDataService.getAllData();

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

    // Gets the most recent sensor data (latest by create_time DESC)
    const GetSensorDataIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSensorDataIntent'
        );
      },
      async handle(handlerInput) {
        try {
          const rows = await dataService.getAllData(); // ordered DESC by create_time
          if (!rows || rows.length === 0) {
            const speakOutput = 'There is currently no sensor data available.';
            return handlerInput.responseBuilder.speak(speakOutput).getResponse();
          }
          const row = rows[0];
          const speakOutput =
            `Most recent reading is from device ${row.deviceId}. ` +
            `Distance ${row.distanceCm} centimeters, ` +
            `Pitch ${row.pitchDeg} degrees, ` +
            `Roll ${row.rollDeg} degrees, ` +
            `Yaw ${row.yawDeg} degrees.`;

          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        } catch (err) {
          console.error('GetSensorDataIntent error:', err);
          const speakOutput = 'Sorry, I had trouble getting the latest sensor data.';
          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        }
      }
    };

    // Create sensor data (expects slots: deviceId, distanceCm, pitchDeg, rollDeg, yawDeg)
    const CreateSensorDataIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateSensorDataIntent'
        );
      },
      
      async handle(handlerInput) {
        try {
          const slots = handlerInput.requestEnvelope.request.intent?.slots || {};
          const deviceId = slots.deviceId?.value;
          const distanceCm = slots.distanceCm?.value;
          const pitchDeg = slots.pitchDeg?.value;
          const rollDeg = slots.rollDeg?.value;
          const yawDeg = slots.yawDeg?.value;

          if (!deviceId || distanceCm == null || pitchDeg == null || rollDeg == null || yawDeg == null) {
            const speakOutput = 'Please provide device id, distance, pitch, roll, and yaw to create a sensor entry.';
            return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
          }

          const body = {
            device_id: deviceId,
            distance_cm: Number(distanceCm),
            pitch_deg: Number(pitchDeg),
            roll_deg: Number(rollDeg),
            yaw_deg: Number(yawDeg)
          };

          const created = await dataService.createData(body);
          const speakOutput =
            `Created entry for device ${created.deviceId}. ` +
            `Distance ${created.distanceCm} centimeters, ` +
            `Pitch ${created.pitchDeg} degrees, ` +
            `Roll ${created.rollDeg} degrees, ` +
            `Yaw ${created.yawDeg} degrees.`;

          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        } catch (err) {
          console.error('CreateSensorDataIntent error:', err);
          const speakOutput = 'Sorry, I could not create the sensor entry.';
          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        }
      }
    };

    // Update sensor data: change device_id for a given sensor entry id
    // Slots expected: sensorId (AMAZON.NUMBER), newDeviceId (string)
    const UpdateSensorDataIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'UpdateSensorDataIntent'
        );
      },
      async handle(handlerInput) {
        try {
          const slots = handlerInput.requestEnvelope.request.intent?.slots || {};
          const sensorId = slots.sensorId?.value;
          const newDeviceId = slots.newDeviceId?.value;

          if (!sensorId || !newDeviceId) {
            const speakOutput = 'Please provide the sensor entry ID and the new device ID.';
            return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
          }

          const updated = await dataService.editData(Number(sensorId), { device_id: newDeviceId });
          const speakOutput = `Updated entry ${updated.id} to device ${updated.deviceId}.`;
          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        } catch (err) {
          console.error('UpdateSensorDataIntent error:', err);
          const speakOutput = 'Sorry, I could not update that sensor entry.';
          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        }
      }
    };

    // Delete the most recent sensor entry (latest by create time from DataService)
    const DeleteSensorDataIntentHandler = {
      canHandle(handlerInput) {
        return (
          Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
          Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeleteSensorDataIntent'
        );
      },
      async handle(handlerInput) {
        try {
          const rows = await dataService.getAllData(); //Gets all data
          if (!rows || rows.length === 0) {
            const speakOutput = 'There is no sensor data to delete.';
            return handlerInput.responseBuilder.speak(speakOutput).getResponse();
          }

          const latest = rows[0];
          await dataService.deleteData(latest.id);

          const speakOutput = `Deleted the most recent entry: id ${latest.id} from device ${latest.deviceId}.`;
          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        } catch (err) {
          console.error('DeleteSensorDataIntent error:', err);
          const speakOutput = 'Sorry, I could not delete the sensor entry.';
          return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        }
      }
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
        GetSensorDataIntentHandler,
        CreateSensorDataIntentHandler,
        UpdateSensorDataIntentHandler,
        DeleteSensorDataIntentHandler,
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
