const admin = require("firebase-admin");
const serviceAccount = require("./adminsdk.json");
const NewsAPI = require("newsapi");
const news = new NewsAPI("5990c04c88cf41dea71c8b2f6375b291");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://vews-news.firebaseio.com"
});

const topicRef = admin.database().ref("/topic");

const MINUTES = 2;

function update() {
    console.log("Updating...");
    news.v2.topHeadlines({
        language: "en",
        pageSize: 1
    }).then(res => {
        console.log("Got top story");
        // noinspection JSPotentiallyInvalidTargetOfIndexedPropertyAccess
        const article = res.articles[0];
        return topicRef.set({
            title: article.title,
            description: article.description,
            date: new Date().toISOString()
        });
    }).then(() => {
        console.log(`Waiting ${MINUTES} minutes...`);
        setTimeout(update, MINUTES * 60 * 1000);
    });
}

update();