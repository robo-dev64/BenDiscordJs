const { Client, Intents } = require("discord.js");
const { AudioPlayerStatus, VoiceConnectionStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");
const { addSpeechEvent } = require("discord-speech-recognition");
// const { clientId, guildId, token } = require('./config.json');
const path = require('path');

const responses = [
    path.join(__dirname, 'audio/no.mp3'), 
    path.join(__dirname, 'audio/yes.mp3'),
    path.join(__dirname, 'audio/uhh.mp3'),
    path.join(__dirname, 'audio/hohoho.mp3')];

const answerPhone = path.join(__dirname, 'audio/phone_answer.mp3');
const hangUp = path.join(__dirname, 'audio/phone_drop.mp3');
const RANDOM_CHANCE = 8;

const player = createAudioPlayer();

function joinChannel(channel) {
  const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false // this may also be needed
  });
  connection.subscribe(player);
  return connection;
}

function playAudio(connection, file_path) {

  if(file_path === null || file_path === undefined){
    const randomReponse = responses[Math.floor(Math.random() * responses.length)];
    file_path = randomReponse;
  }
  // Subscribe the connection to the audio player (will play audio on the voice connection)
  const resource = createAudioResource(file_path);
  resource.volume = 1;
  player.play(resource);

}

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});

addSpeechEvent(client);

client.on("messageCreate", (msg) => {

  if(msg.content === 'join'){
    const voiceChannel = msg.member?.voice.channel;

    if (voiceChannel) {
      var connection = joinChannel(voiceChannel);
      playAudio(connection, answerPhone);

      setTimeout(() => {

        msg.delete();
      }, 5000);  
    }
  }

  if(msg.content === 'leave'){
    const voiceChannel = msg.member?.voice.channel;
    const botChannel = msg.guild.me.voice.channel;
    if(!botChannel) return msg.channel.send('I am not in a voice channel.')
      .then((msg) => 
      setTimeout(() => {
        msg.delete();
      }, 5000));
    
    player.stop();
    playAudio(getVoiceConnection(voiceChannel.guildId), hangUp);

    player.once(AudioPlayerStatus.Idle, () => {
      getVoiceConnection(voiceChannel.guildId).disconnect();
      getVoiceConnection(voiceChannel.guildId).destroy();
      msg.delete();                
    });
  }
});

client.on("speech", (msg) => {
  if(!AudioPlayerStatus.Idle) return;
  if(msg.content) {

      var random = Math.random() * 100;

      const voiceChannel = msg.member?.voice.channel;

      if(random <= RANDOM_CHANCE) {       
        
        player.stop();
        playAudio(getVoiceConnection(voiceChannel.guildId), hangUp);      
    
        player.once(AudioPlayerStatus.Idle, () => {
          getVoiceConnection(voiceChannel.guildId).disconnect();
          getVoiceConnection(voiceChannel.guildId).destroy();
        });
        
        return;
      }
      
      if (voiceChannel) {
        var connection = joinChannel(voiceChannel);
        playAudio(connection);
      }   
      
  }
    
});


player.on(AudioPlayerStatus.Playing, () => {
  console.log('Playing');
});

client.on("ready", () => {
  console.log("Ready!");
  client.user.setActivity(" your every move.", {type: "WATCHING"})
});

client.login(process.env.Token);
