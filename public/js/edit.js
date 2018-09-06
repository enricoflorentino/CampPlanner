trans = document.querySelector("#trans");
seats = document.querySelector("#seats");
   
seats.disabled = true;   
   
trans.addEventListener("input", function(){
    if(trans.value == "I am a driver") {
       seats.disabled = false; 
    }
     if (trans.value == "I am a passenger") {
        seats.disabled = true;
    }
});