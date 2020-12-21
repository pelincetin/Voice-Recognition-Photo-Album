const success_html = `<div class="alert alert-success alert-dismissible fade show" role="alert">
  <strong>It worked!</strong> Your image has been uploaded to your photo album. Enjoy.
  <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
</div>`;
    const failure_html = `<div class="alert alert-danger alert-dismissible fade show" role="alert">
  <strong>Something went wrong!</strong> You should check in on that file, because there was an error uploading it. Try again later.
  <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
</div>`;
	const no_photos_found = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
  <strong>There are no pictures of that!</strong> Maybe you should upload some...
  <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
</div>`;


window.file = "dummy value until this gets set";

function getBase64(file) {
   var reader = new FileReader();
   reader.readAsDataURL(file);
   reader.onload = function () {
   	 window.file = reader.result;
     console.log(reader.result);
   };
   reader.onerror = function (error) {
     console.log('Error: ', error);
   };
}

function init(){
  document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}

function handleFileSelect(event){
  const reader = new FileReader()
  reader.onload = getBase64(event.target.files[0])
}

function handleFileLoad(event){
  console.log(event);
  document.getElementById('fileContent').textContent = event.target.result;
}

function sendData(data) {
	let config = {
        headers:{'Content-Type': data.type}
    };
}

$(document).ready(function() {
	var apigClient = apigClientFactory.newClient();
	var noteTextarea = $('#transcript');
	//var rec=Recorder({
        //bitRate:32,
        //sampleRate:24000
    //});

    try {
	  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	  var recognition = new SpeechRecognition();
	}
	catch(e) {
	  console.error(e);
	  $('.no-browser-support').show();
	  $('.app').hide();
	}

	// This block is called every time the Speech APi captures a line. 
	recognition.onresult = function(event) {

		// event is a SpeechRecognitionEvent object.
		// It holds all the lines we have captured so far. 
		// We only need the current one.
		var current = event.resultIndex;

		// Get a transcript of what was said.
		var transcript = event.results[current][0].transcript;

		// Add the current transcript to the contents of our Note.
		// There is a weird bug on mobile, where everything is repeated twice.
		// There is no official solution so far so we have to handle an edge case.
		var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
		if(!mobileRepeatBug) {
		    noteTextarea.val(transcript);
		}
	};

    $("#send_it").click(function() {
    	var params = {};
		var body = {
		    img: window.file
		};
		var additionalParams = {"q": $("#transcript").val()};

    	apigClient.uploadPut(params, body, additionalParams)
	    .then(function(result){
	    	$("#status").html(success_html);
	        console.log(result);
	    }).catch( function(result){
	    	$("#status").html(failure_html);
	        console.log(result);
	    });
	});
	$("#reset-button").click(function() {
		$("#transcript").val('')
	});
	$("#search-button").click(function(){
		console.log($("#transcript").val())
		let params ={q: $("#transcript").val()};
		console.log(params)
		var body = {};
		var additionalParams = {};
		apigClient.searchGet(params, body, additionalParams)
	    .then(function(result){
	        //This is where you would put a success callback
	        console.log(result)
	        results = result["data"];
	        console.log(typeof(results))
	        $(".frame").html("");
	        for (var i = 0; i < results.length; i++) {
	        	console.log("hey")
	        	const imageUrl = results[i];
	        	console.log(imageUrl)
	        	$(".frame").append('<div class="card"><img src="' + imageUrl + '" class="card-img-top"> </div>');
	        }
	        if (results.length == 0) {
				$(".first-card").append(no_photos_found);
	        }
	        console.log(result);
	    }).catch( function(result){
	        //This is where you would put an error callback
	        console.log(result);
	    });
	})
	$("#record_button").click(function() {
		console.log('I was clicked')
		$("#record_button").attr("disabled", true);
		$("#stop-record").attr("disabled", false);
		recognition.start();

		//rec.open(function(){
            //rec.start();
        //},function(msg,isUserNotAllow){
            //console.log((isUserNotAllow?"UserNotAllow，":"")+"can't record:"+msg);
        //});

        $("#stop-record").click(function(){
        	console.log("Stopping")
        	$("#record_button").attr("disabled", false);
        	$("#stop-record").attr("disabled", true);
        	recognition.stop();
        	//rec.stop(function(blob,duration){
            //console.log(URL.createObjectURL(blob),"Duration:"+duration+"ms");
            //console.log(blob);
            //rec.close();
            //var audio=document.createElement("audio");
            //audio.controls=true;
            //document.body.appendChild(audio);
            //audio.src=URL.createObjectURL(blob);
            //console.log(audio.src)
            //audio.play();
            //sendData(blob)
        });
    });
});