//version 1

let localStorageVersion = 1;
let formData = {
    selectedServices: [],
    selectedBarber: [],
    locationInfos: [],
    businessHours: [],
    sosHours: [],
    haircutInfos: [],
    availableBarbers: [],
    availableServiceTypes: [],
    availableServices: [],
    selectedAppointmentInfos: [],
    firstScreen: [],
    branding: [],
    serviceTypeSelected: '',
    hasClosedAppointment: false,
    businessAddress: '',
    businessName: '',
    businessPhone: '',
    blong: '',
    blat: '',
    portfolio: [],
    businessLogo: '',
    durationTimeText: ''
};
var mapboxAccessToken = 'pk.eyJ1IjoiZG13ZWIiLCJhIjoiY2xqZDZuamxsMDF2aTNjbnFicHZyZHBiayJ9.3QzbsMlaN8u3sfMqjJasFA';
var cancelVibration = false;
var vibrationActivated = false;
let deferredPrompt;

/**
 * Tool functions start
 * */
const debounce = (func, wait, immediate)=> {
    var timeout;
    return function executedFunction() {
        var context = this;
        var args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

const print_available_appointments_loader = debounce(print_available_appointments_new, 600);

const inputValidation = debounce(validateInput, 400, false);

$(document).ready(function () {
    checkAndClearLocalStorage();
    initialize_app();
    document.querySelectorAll("input").forEach(input => {input.addEventListener("focus", function() {this.style.backgroundColor = "#f8f9fa";});input.addEventListener("blur", function() {this.style.backgroundColor = "#ffffff";});});
    document.querySelectorAll("input").forEach(input => {input.style.transition = "all 0.2s ease-in-out";});
    document.querySelectorAll("label").forEach(label => {label.style.fontSize = "1.2rem";});
    document.querySelectorAll("input").forEach(input => {input.style.fontSize = "1.2rem";});
    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(function() {
        const controlsDivs = document.querySelectorAll('.controls');
        // Loop over each 'controls' div
        controlsDivs.forEach((controlsDiv) => {
            const prevButton = controlsDiv.querySelector('.prevStepButton');
            const nextButton = controlsDiv.querySelector('.nextStepButton');
            const prevButtonDisabled = controlsDiv.querySelector('.prevStepButtonDisabled');
            const nextButtonDisabled = controlsDiv.querySelector('.nextStepButtonDisabled');
            // Check if enabled buttons exist and remove corresponding disabled button
            if (prevButton) prevButtonDisabled?.remove();
            if (nextButton) nextButtonDisabled?.remove();
        });
    });

    var observer2 = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Ensure it's an element node (not text, etc.)
                        // If the added node has class "toFillInput", add the event listener
                        if (node.classList.contains('toFillInput')) {
                            node.addEventListener('focusout', validateAllInputs);
                            node.addEventListener('input', validateAllInputs);
                            node.addEventListener('change', validateAllInputs);
                            node.addEventListener('focusin', validateAllInputs);
                        }
                        // If the added node contains children with class "toFillInput", add the event listener to them
                        else if (node.querySelectorAll('.toFillInput').length > 0) {
                            node.querySelectorAll('.toFillInput').forEach(function(childNode) {
                                childNode.addEventListener('focusout', validateAllInputs);
                                childNode.addEventListener('input', validateAllInputs);
                                childNode.addEventListener('change', validateAllInputs);
                                childNode.addEventListener('focusin', validateAllInputs);
                            });
                        }
                    }
                });
            }
        });
    });
    // Configuration of the observer
    var config = {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    };
    // Pass in the target node, as well as the observer options
    observer2.observe(document.body, config); // Target node is the body of the document

    // Specify what parts of the DOM to observe
    var targets = document.querySelectorAll('.controls');
    var config = { childList: true, attributes: true, subtree: true };

    // Start observing all targets
    targets.forEach(target => observer.observe(target, config));

    //Only portrait mode on app
    window.addEventListener("orientationchange", function() {
        if (screen.orientation.type.includes("landscape")) {
            $('html').attr('style', 'overflow: auto !important');
            $('#wrapper').addClass('minimizeH');
            document.getElementById("landscape-alert").style.display = "block";
        }else{
            $('html').removeAttr('style');
            $('#wrapper').removeClass('minimizeH');
            document.getElementById("landscape-alert").style.display = "none";
        }
    });

    $(document).on("click", ".freeAppointment", function() {
        if($('.pricePreviewCont > #sosPriceEnabled').length){
            $('html, body').animate({scrollTop: 0}, 150);
        }
        $('#sosPriceEnabled').remove();
        var sumPrice = formData.haircutInfos.sumPrice;
        var exportedHtml = sumPrice +' € ';
        $('.pricePreviewCont').html(exportedHtml);
        $(".selected-time-appointment").css("border", "1px solid #7b7b7b70").css('box-shadow','none').removeClass("selected-time-appointment");
        $(this).css("border", "1px solid #0dda92").css('box-shadow','inset 0px 0px 50px 0px #242424').addClass('selected-time-appointment');
        $(".isSos").removeClass("selectedSos");
        var appointmentElement = $(this).children('div').get(0);

        // Create the object
        var startDate = appointmentElement.getAttribute('data-ondate');

        var appointmentData = {
            startTime: appointmentElement.getAttribute('data-starttime'),
            endTime: appointmentElement.getAttribute('data-endtime'),
            isSos: appointmentElement.getAttribute('data-issos'),
            onDate: startDate,
            durationTimeText: $(this).text(),
        };
        update_data_center('selectedAppointmentInfos',appointmentData);
        var dateTimeselected = appointmentData['onDate'];
        // Convert dateTimeselected to a Date object
        var date = new Date(dateTimeselected);
        // Extract and format parts of the date
        var day = date.getDate();
        var month = date.getMonth() + 1; // Months are 0-based in JavaScript
        var year = date.getFullYear();
        // Pad day, month, hours, and minutes with leading zeros, if needed
        day = day < 10 ? '0' + day : day;
        month = month < 10 ? '0' + month : month;
        // Format the date as 'D:m:Y H:i'
        var formattedDate = day + '/' + month + '/' + year + ' '+appointmentElement.innerHTML;
        $('#previewContDateTime').html('<div class="col-lg-12 customDateTimePreviewScreen"><p>'+ (renderLang() === "el" ? "Επιλεγμένη ημερομηνία και ώρα ραντεβού" : "Selected Appointment Date & time") +'</p><h2 style="font-size: 20px;">'+ formattedDate +'</h2></div>').css('padding','0px');
    });

    $(document).on("click", ".freeAppointment2", function() {
        if($('.pricePreviewCont > #sosPriceEnabled').length){
            $('html, body').animate({scrollTop: 0}, 150);
        }
        $('#sosPriceEnabled').remove();
        var sumPrice = formData.haircutInfos.sumPrice;
        var exportedHtml = sumPrice +' € ';
        $('.pricePreviewCont').html(exportedHtml);
        $(".selected-time-appointment").css("border", "1px solid #7b7b7b70").css('box-shadow','none').removeClass("selected-time-appointment");
        $(this).css("border", "1px solid #0dda92").css('box-shadow','inset 0px 0px 50px 0px #242424').addClass('selected-time-appointment');
        $(".isSos").removeClass("selectedSos");
        var appointmentElement = $(this).get(0);
        // Create the object
        var startDate = appointmentElement.getAttribute('data-ondate');
        var appointmentData = {
            startTime: appointmentElement.getAttribute('data-starttime'),
            endTime: appointmentElement.getAttribute('data-endtime'),
            isSos: appointmentElement.getAttribute('data-issos'),
            onDate: startDate,
            durationTimeText: $(this).text(),
        };
        update_data_center('selectedAppointmentInfos',appointmentData);
        var dateTimeselected = appointmentData['onDate'];
        // Convert dateTimeselected to a Date object
        var date = new Date(dateTimeselected);
        // Extract and format parts of the date
        var day = date.getDate();
        var month = date.getMonth() + 1; // Months are 0-based in JavaScript
        var year = date.getFullYear();
        // Pad day, month, hours, and minutes with leading zeros, if needed
        day = day < 10 ? '0' + day : day;
        month = month < 10 ? '0' + month : month;
        // Format the date as 'D:m:Y H:i'
        var formattedDate = day + '/' + month + '/' + year + ' ' +appointmentElement.innerHTML;
        $('#previewContDateTime').html('<div class="col-lg-12 customDateTimePreviewScreen"><p>'+ (renderLang() === "el" ? "Επιλεγμένη ημερομηνία και ώρα ραντεβού" : "Selected Appointment Date & time") +'</p><h2 style="font-size: 20px;">'+ formattedDate +'</h2></div>').css('padding','0px');
    });

    $(document).on("click", "#sameAppNew", function() {
        bookScreenManagement('prev','direct','bookScreen','hourSelectionScreen');
    });

    $(document).on("click", ".isSos", function() {
        $(".selected-time-appointment").css("border", "1px solid #7b7b7b70").css('box-shadow','none').removeClass("selected-time-appointment");
        if($('.pricePreviewCont > #sosPriceEnabled').length === 0){
            $('html, body').animate({scrollTop: 0}, 150);
        }
        setTimeout(function(){
            if(formData.haircutInfos.sumPrice){
                var sumPrice = formData.haircutInfos.sumPrice;

                if(formData.haircutInfos.extraData){
                    var servicesPrice = formData.haircutInfos.extraData.servicesPrice;
                    var distancePrice = formData.haircutInfos.extraData.distancePrice;
                }else{
                    var servicesPrice = sumPrice;
                    var distancePrice = 0;
                }
                var sosPercentage = formData.haircutInfos.sosPercentage;
                var exportedPrice = (servicesPrice * (1 + sosPercentage / 100)).toFixed(0);
                var extraPrice = parseInt(exportedPrice) - servicesPrice;
                var finalExportedPrice = parseInt(exportedPrice) + distancePrice + ' €';
                if(formData.haircutInfos.extraData){
                    var extraStyle = 'width: 80%;margin-left: auto;';
                }else{
                    var extraStyle = '';
                }
                var exportedHtml = '<div class="shine-effect" id="sosPriceEnabled" style="'+extraStyle+'">' +
                    '                   <div class="customFA" style="font-size: 25px;">' +
                    '                       <i class="fa customFA fa-caret-up" aria-hidden="true" style="FONT-SIZE: 25px;"></i>' +
                    '                       '+ finalExportedPrice +'</div>' +
                    '                   <div style="font-size: 12px;">' +
                    '                       '+ sumPrice +'€  <span style="color: #0dda92;font-size: 10px;">+ '+ extraPrice +'€ SOS</span>' +
                    '                   </div>' +
                    '              </div>';
                $('.pricePreviewCont').html(exportedHtml);
                // Create the object
                var appointmentElement = $('#freeAppointments').find('.isSos.selectedSos > div'); // if ui change this will create an issue
                var appointmentData = {
                    startTime: appointmentElement.data('starttime'),
                    endTime: appointmentElement.data('endtime'),
                    isSos: appointmentElement.data('issos'),
                    durationTimeText: $('#freeAppointments').find('.isSos.selectedSos > div').html()
                };
                update_data_center('selectedAppointmentInfos',appointmentData);
            }
        },200);
        $(".isSos").removeClass("selectedSos");
        $(this).addClass('selectedSos');
    });

    $(document).on("click", ".saveAppointment", function() {if(!$(this).hasClass('disabled')){saveAppointment();}});

    $(window).on('scroll', function() {
        const langDropdown = document.querySelector(".lang-dropdown");
        // If dropdown exists, remove it
        if (langDropdown) {
            $('.lang-custom-selector').removeClass('lang-custom-selector-active');
            setTimeout(function(){
                langDropdown.remove();
            },100);
        }
    });

    $(".icon").click(function() {
        if ($(this).hasClass('iconActive')) {
            return;
        }
        var urlParams = new URLSearchParams(window.location.search);

        var page = urlParams.get('page');
        var iconClass = $(this).find('i').attr('class');
        // remove active class from all icons
        $(".icon").removeClass('iconActive');

        // add active class to clicked icon
        $(this).addClass('iconActive');

        // decide the page based on icon class
        switch (iconClass) {
            case 'fa fa-user':
                page = 'user';
                break;
            case 'fa fa-calendar-plus-o':
                page = 'bookAppointment';
                if(!formData.firstScreen.data){
                    first_render();
                }
                break;
            case 'fa fa-info-circle':
                page = 'infos';
                break;
            case 'fa fa-qrcode':
                page = 'qrcode';
                break;
            default:
                page = '';
        }
        // append the page parameter
        urlParams.set('page', page);
        // form the new URL
        var newUrl = `/?${urlParams.toString()}`;
        // push the new URL to history
        window.history.pushState({path: newUrl}, '', newUrl);
        // if(formData.firstScreen.data){
        appScreensManagement(page);
        //  }
    });

   /* if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/service-worker.js')
                .then(function(registration) {
                }, function(err) {
                });
        });
    }*/
   /* window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
    });*/
});

function showInstallPromotion() {
    var lastShown = localStorage.getItem('installPromotionLastShown');
    var currentDate = new Date();

    if (lastShown) {
        var diff = currentDate.getTime() - new Date(lastShown).getTime();
        var diffInHours = diff / (1000 * 60 * 60);
        if (diffInHours < 24) {
            return;
        }
    }
    let modal = document.getElementById('installModal');
    var modalContent = $("#installModalContent");
    var installBtn = $('<a href="#" id="installBtn" class="modal-close waves-effect waves-green btn-flat customButton btn" style="width:100%;margin-bottom: 20px;">'+ (renderLang() === "el" ? "Ενεργοποίηση ειδοποιήσεων" : "Enable Notifications") +'</a>');
    var notInterestedBtn = $('<a href="#" id="notInterestedBtn" class="modal-close waves-effect waves-red btn-flat">'+ (renderLang() === "el" ? "Δεν ενδιαφέρομαι" : "Not Interested") +'</a>');

    if (modalContent.length > 0 && installBtn.length > 0) {
        installBtn.on('click', installPWA);
        notInterestedBtn.on('click', function() {
            modal.style.display = "none";
        });
        modalContent.html('<h4>'+ (renderLang() === "el" ? "Θέλετε να λαμβάνετε υπενθυμίσεις;" : "Would you like to receive reminders?") +'</h4><p style="text-align: center;font-style: oblique;">'+ (renderLang() === "el" ? "Ενεργοποιήστε τις ειδοποιήσεις για να λαμβάνετε υπενθυμίσεις ραντεβού και ενημερώσεις απευθείας στη συσκευή σας." : "Enable notifications to receive appointment reminders and updates directly on your device.") +'</p>');
        modalContent.append(installBtn);
        modalContent.append(notInterestedBtn);
        $("#installModal").show();
        localStorage.setItem('installPromotionLastShown', currentDate);
    }
}

function installPWA() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {

        } else {

        }
        deferredPrompt = null;
    });
}

function checkAndClearLocalStorage() {
    const savedVersion = localStorage.getItem('localStorageVersion');

    if (savedVersion) {
        if (Number(savedVersion) < localStorageVersion) {
            clearLocalStorage();
            localStorage.setItem('localStorageVersion', localStorageVersion);
        }
    } else {
        localStorage.setItem('localStorageVersion', localStorageVersion);
    }
}

function validateAllInputs() {
    // Get all inputs with class "toFillInput"
    var inputs = document.querySelectorAll('.toFillInput');

    // Call the validateInput function on each of these inputs
    inputs.forEach(function(input) {
        validateInput(input);
    });
}

function clean_screens_cache(type){
    if(type === 'full'){
         $('#serviceTypeSelectionScreen').html('');
    }
    $('.controls').html('');
    $('#categoryAndServicesSelectionScreen').html('');
    $('#barberSelectionScreen').html('');
    $('#locationTrackScreen').html('');
    $('#hourSelectionScreen').html('');
    $('#bookScreen').html('');
    $('#user').html('');
    $('#qrcode').html('');
    $('#infos').html('');
}

function clean_state_cache(type){
    switch (type) {
        case 'all':
            formData.selectedServices = [];
            formData.selectedBarber = [];
            formData.locationInfos = [];
            formData.haircutInfos = [];
            formData.availableBarbers = [];
            formData.availableServiceTypes = [];
            formData.availableServices = [];
            formData.branding = [];
            formData.serviceTypeSelected = '';
            formData.selectedAppointmentInfos = '';
            break;
        case 'barber':
            formData.selectedBarber = [];
            formData.availableBarbers = [];
            break;
        case 'services':
            formData.selectedServices = [];
            formData.availableServices = [];
            break;
        case 'location':
            formData.locationInfos = [];
            break;
        case 'haircutInfos':
            formData.haircutInfos = [];
            break;
        case 'serviceTypeSelected':
            formData.serviceTypeSelected = '';
            formData.availableServiceTypes = '';
            break;
        case 'selectedAppointment':
            formData.selectedAppointmentInfos = [];
            break;
    }
}

function initialize_app(){
    if(screen.width < '999'){
        remove_side_menu();
    }
    render_bottom_menu();
    // get the current URL's query parameters
    var urlParams = new URLSearchParams(window.location.search);
    // get the page parameter
    var page = urlParams.get('page');
    // if page parameter is not set, set it to 'bookAppointment' and update the URL
    if (!page) {
        page = 'bookAppointment';
        urlParams.set('page', page);
        // form the new URL
        var newUrl = `/?${urlParams.toString()}`;
        // replace the current URL with the new URL
        window.history.replaceState({path: newUrl}, '', newUrl);
    }
    // if page parameter equals to 'bookAppointment', make the main icon active
    if (page === 'bookAppointment') {
        $('.fa-calendar-plus-o').parent().addClass('iconActive');
    } else {
        // decide the icon to activate based on page parameter
        switch (page) {
            case 'user':
                $('.fa-user').parent().addClass('iconActive');
                break;
            case 'infos':
                $('.fa-info-circle').parent().addClass('iconActive');
                break;
            case 'qrcode':
                $('.fa-qrcode').parent().addClass('iconActive');
                break;
        }
    }
    preSelectLang();
    appScreensManagement(page,'firstRender'); // render the screen immediately
}

function update_data(){
    if (formData && !formData.businessName) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        var place = urlParams.get('keyl');
        $.ajax({
            type: "POST",
            url: "https://api.datelly.com",
            data: {
                action: "firstRender",
                keyl: place,
                type: 'serviceTypeSelection',
                lang: renderLang()
            },
            success: function(response) {
                var response = JSON.parse(response);
                update_data_center('businessHours',response.businessHours);
                update_data_center('sosHours',response.sosHours);
                update_data_center('firstScreen',response.screen);
                update_data_center('businessName',response.businessInfos.businessName);
                update_data_center('businessAddress',response.businessInfos.businessAddress);
                update_data_center('businessPhone',response.businessInfos.businessPhone);
                update_data_center('blong',response.businessInfos.longitude);
                update_data_center('blat',response.businessInfos.latitude);
                update_data_center('portfolio',response.gallery);
                update_data_center('businessLogo',response.businessInfos.businessLogo);
                if(response.branding === 1){
                    $('.branding').html('' +
                        ' Barbreon.gr ' +
                        '<strong style="color:lightyellow;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 1em; width: 1em; vertical-align: middle;line-height: 1;"><defs><style>.a{fill:none;stroke:currentColor;stroke-linejoin:round;stroke-width:1.5px;}</style></defs><path class="a" d="M5.5,23.247l4.052-9.454a.751.751,0,0,0-.689-1.046H5.9A.749.749,0,0,1,5.21,11.7L9.8,1.2a.75.75,0,0,1,.687-.45h7.7a.75.75,0,0,1,.585,1.219l-4.05,5.063a.75.75,0,0,0,.586,1.218H18.69a.75.75,0,0,1,.53,1.281Z"></path></svg></strong> ' +
                        '<span style="color: grey">by DeltaSoft</span>');
                }
                return response;
            }
        });
    }
}

function first_render() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var place = urlParams.get('keyl');
    $.ajax({
        type: "POST",
        url: "https://api.datelly.com",
        data: {
            action: "firstRender",
            keyl: place,
            type: 'serviceTypeSelection',
            lang: renderLang()
        },
        success: function(response) {
            var response = JSON.parse(response);
            update_data_center('businessHours',response.businessHours);
            update_data_center('sosHours',response.sosHours);
            update_data_center('firstScreen',response.screen);
            update_data_center('businessName',response.businessInfos.businessName);
            update_data_center('businessAddress',response.businessInfos.businessAddress);
            update_data_center('businessPhone',response.businessInfos.businessPhone);
            update_data_center('blong',response.businessInfos.longitude);
            update_data_center('blat',response.businessInfos.latitude);
            update_data_center('portfolio',response.gallery);
            update_data_center('businessLogo',response.businessInfos.businessLogo);
            if(response.branding === 1){
                $('.branding').html('' +
                    ' Barbreon.gr ' +
                    '<strong style="color:lightyellow;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 1em; width: 1em; vertical-align: middle;line-height: 1;"><defs><style>.a{fill:none;stroke:currentColor;stroke-linejoin:round;stroke-width:1.5px;}</style></defs><path class="a" d="M5.5,23.247l4.052-9.454a.751.751,0,0,0-.689-1.046H5.9A.749.749,0,0,1,5.21,11.7L9.8,1.2a.75.75,0,0,1,.687-.45h7.7a.75.75,0,0,1,.585,1.219l-4.05,5.063a.75.75,0,0,0,.586,1.218H18.69a.75.75,0,0,1,.53,1.281Z"></path></svg></strong> ' +
                    '<span style="color: grey">by DeltaSoft</span>');
            }
            render_app();
        }
    });
}

function render_app(){
    clean_screens_cache('full');
    $('.appScreens').css('display','none');
    $('#bookAppointment').css('display','flex');
    if(!$('.main-icon').hasClass('iconActive')){
        $(".icon").removeClass('iconActive');
        $('.main-icon').addClass('iconActive');
    }
    service_type_selection_screen();
}

function preSelectLang() {
    const langSelector = document.querySelector(".lang-selector");
    const langDropDown = document.querySelector(".lang-custom-selector");
    const selectedLangImgDiv = document.querySelector("#selected-lang-img-cont");

    // Parse the current URL and its query parameters
    const url = new URL(window.location.href);
    let urlLang = url.searchParams.get("lang");

    const browserLang = navigator.language || navigator.userLanguage;
    let currentLang;

    // If a 'lang' query parameter is present, use it
    if (urlLang) {
        currentLang = urlLang.startsWith("el") ? "el" : "en";
    }
    // Else use the browser language
    else {
        currentLang = browserLang.startsWith("el") ? "el" : "en";
        // Set urlLang to be the same as the currentLang
        urlLang = currentLang;
        // Add the 'lang' query parameter to the URL
        url.searchParams.set("lang", currentLang);
        // Update the URL without causing the page to refresh
        history.pushState({}, '', url.toString());
    }

    // Append img tag inside the selectedLangImgDiv
    selectedLangImgDiv.innerHTML = `<img class="selected-lang-img" src="img/${currentLang === "el" ? "gr" : "us"}.svg" />`;

    langSelector.addEventListener("click", function () {
        const langDropdown = document.querySelector(".lang-dropdown");
        // If dropdown exists, remove it
        if (langDropdown) {
            $('.lang-custom-selector').removeClass('lang-custom-selector-active');
            setTimeout(function(){
                langDropdown.remove();
            },100);
        } else {
            // Create and append dropdown
            const dropdown = document.createElement('div');
            dropdown.className = "lang-dropdown";
            dropdown.innerHTML = `
                <div class="lang-option" data-lang="el">
                    <img class="lang-flag" src="img/gr.svg"> Ελληνικά
                </div>
                <div class="lang-option" data-lang="en">
                    <img class="lang-flag" src="img/us.svg"> English
                </div>
            `;
            langDropDown.appendChild(dropdown);
            setTimeout(function(){
                $('.lang-custom-selector').addClass('lang-custom-selector-active');
            },100);

            const langOptions = document.querySelectorAll(".lang-option");

            langOptions.forEach(function (option) {
                option.addEventListener("click", function () {
                    currentLang = this.getAttribute("data-lang");
                    selectedLangImgDiv.innerHTML = `<img class="selected-lang-img" src="img/${currentLang === "el" ? "gr" : "us"}.svg" />`;
                    // Add the 'lang' query parameter to the URL
                    url.searchParams.set("lang", currentLang);
                    // Update the URL without causing the page to refresh
                    history.pushState({}, '', url.toString());
                    first_render();
                });
            });
        }
    });
}

function renderLang(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var lang = urlParams.get('lang');
    if(lang !== null && lang !== ''){
        if (lang === 'el' || lang === 'en'){
            return lang;
        }else{
            return 'en';
        }
    }else{
        return 'en';
    }
}

function add_loader(type) {
    //TODO na grapsw se olous tous loader pio screen kanei load
    //categoryAndServicesSelectionScreen
    //hourSelectionScreen
    //barberSelectionScreen
    //serviceTypeSelectionScreen
    $('.controls').css('display','none');
    $('.'+type).css('display','flex');
    const langDropdown = document.querySelector(".lang-dropdown");
    // If dropdown exists, remove it
    if (langDropdown) {langDropdown.remove();}
    $('.mainUsageScreen').css('display','none');
    $('html, body').scrollTop(0);
    if (type === 'map') {
        remove_loader(); // todo afto gia na ginei fix o loader me ton map otan einai direct access sto map
    }
    if (!$('.loaderCont').length) {
        if (type === 'locationTrackScreen') {
            var loaderHtml = '      <div id="mapLoader" class="loaderCont loaderContExtra"><div style="width: 100%; height: 180px;margin-top: auto; margin-bottom: auto;">' +
                '                       <div class="row">' +
                '                           <div class="col-lg-12" style=" position: absolute;z-index: 1; left: -1px;margin-top: 10px;">' +
                '                               <span class="loader loaderMAP"></span>' +
                '                           </div>' +
                '                           <div class="col-lg-12">' +
                '                               <img style="opacity: 0.9" src="images/map.png">' +
                '                           </div>' +
                '                       </div>' +
                '                       <div class="row">' +
                '                           <div style="margin:auto;height: 40px;padding-top: 10px;">'+ (renderLang() === "el" ? "Εντοπισμός τοποθεσίας..." : "Location tracking..."); +'</div>' +
                '                       </div>' +
                '                       </div>' +
                '                   </div>';
        }else{
            var loaderHtml = '<div class="col-lg-12 loaderCont"><span class="loader"></span></div>';
        }
        $('#removeTitle').after(loaderHtml);
        $('#page-wrapper').css('overflow','hidden');
    }
}

function remove_loader(){
    const langDropdown = document.querySelector(".lang-dropdown");
    // If dropdown exists, remove it
    if (langDropdown) {
        $('.lang-custom-selector').removeClass('lang-custom-selector-active');
        setTimeout(function () {
            langDropdown.remove();
        }, 100);
    }
    $('.loaderCont').remove();
    $('#page-wrapper').css('overflow','');
    $('.branding').css('display','block');
}

function screen_renderer(screen,dataToPass) {
    $('.mainUsageScreen').css('display','none');
    $('#' +screen).html(dataToPass).parent('div').css('display', 'block');
}

function cached_screen_render(screen){
    $('.mainUsageScreen').css('display','none');
    $('#' +screen).parent('div').css('display', 'block');
    $('.'+screen).css('display','flex');
}

function activateHover(id, name, categoryId) {
    const customHover = document.getElementById("hover-" + id);
    if (customHover.classList.contains("active-custom-hover")) {
        customHover.classList.remove("active-custom-hover");
        if (name) {
            document.getElementById(name).checked = false;
        }
        // Remove the service from selectedServices array
        const index = formData.selectedServices.findIndex(service => service.id === id);
        if (index !== -1) {
            formData.selectedServices.splice(index, 1);
        }
    } else {
        customHover.classList.add("active-custom-hover");
        if (name) {
            document.getElementById(name).checked = true;
        }
        // Add the service to selectedServices array if it's not already present
        if (!formData.selectedServices.some(service => service.id === id)) {
            formData.selectedServices.push({ id, name, categoryId });
        }
    }
    // Update the formData object
    const propertyPath = `selectedServices.${formData.selectedServices.length - 1}`;
    const data = formData.selectedServices[formData.selectedServices.length - 1];
    update_data_center(propertyPath, data);
}

function clean_service_selection(){
    let elements = document.querySelectorAll('.active-custom-hover');
    elements.forEach((element) => {
        element.classList.remove('active-custom-hover');
    });
    let selectedServices = getSelectedServices();
    selectedServices.forEach((serviceName) => {
        let checkboxElement = document.getElementById(serviceName);
        if (checkboxElement) {
            checkboxElement.checked = false;
        }
    });
    $('.categoryAndServicesSelectionScreen > .nextStepButton').remove();
    formData.selectedServices = [];
}

function update_data_center(propertyPath, data) {
    const properties = propertyPath.split('.');
    let target = formData;

    for (let i = 0; i < properties.length - 1; i++) {
        const property = properties[i];
        target = target[property];

        if (typeof target !== 'object' || target === null) {
            throw new Error(`Property path "${propertyPath}" is invalid`);
        }
    }
    const lastProperty = properties[properties.length - 1];
    // Check if the target property is an object
    if (typeof target[lastProperty] === 'object' && target[lastProperty] !== null) {
        // If it's an object, update its properties
        Object.assign(target[lastProperty], data);
    } else if (Array.isArray(target) && properties.length === 2) {
        // Check if it's an array property with length 1
        if (target.length === 1 && target[0].id === data.id) {
            // Clear the array if the first element is being deselected
            target.length = 0;
        } else {
            // Remove the specific service from the array
            const index = target.findIndex(service => service.id === data.id);
            if (index !== -1) {
                target.splice(index, 1);
            }
        }
    } else {
        // If it's a one-dimensional property, assign the data value
        target[lastProperty] = data;
    }
    /*console.log(`Updated property "${propertyPath}"`);
    console.log(formData, 'Object state');*/
    // Additional cases based on selectedServices length
    if (properties[0] === 'selectedServices' && properties.length === 2) {
        const selectedServicesLength = formData.selectedServices.length;
        if (selectedServicesLength >= 1) {
            if (!$('.categoryAndServicesSelectionScreen > .nextStepButton').length) {
                $('.categoryAndServicesSelectionScreen').append(bookScreenManagement('next','controls','categoryAndServicesSelectionScreen',false));
            }
        } else {
            $('.categoryAndServicesSelectionScreen > .nextStepButton').addClass('customButtonDisabled').addClass('nextStepButtonDisabled').removeClass('customButton').removeClass('nextStepButton');
        }
    }
    if (properties[0] === "selectedAppointmentInfos") {
        if (!$('.hourSelectionScreen > .nextStepButton').length) {
            $('.hourSelectionScreen').append(bookScreenManagement('next','controls','hourSelectionScreen','bookScreen'));
        }
    }
}

function gatherFilledBookingScreens() {
    // List of specific div ids you want to select
    let divIds = [
        'serviceTypeSelectionScreen',
        'categoryAndServicesSelectionScreen',
        'barberSelectionScreen',
        'locationTrackScreen',
        'hourSelectionScreen',
        'bookScreen'
    ];

    let nonEmptyDivs = [];

    // Check each div to see if it is non-empty
    divIds.forEach((id) => {
        let div = document.getElementById(id);
        if (div && div.innerHTML.trim() !== "") {
            nonEmptyDivs.push(div);
        }
    });
    if(nonEmptyDivs[nonEmptyDivs.length - 1]){
        return nonEmptyDivs[nonEmptyDivs.length - 1].id;
    }
    return false;
}

function checkIfBusinessHours(businessHours, soshours) {
    // business hours must be always > from sos hours, and sos hours will be a minimum of working hours + extra hours
    // So the sos hours will never be less than business hours
    var selectedWorkingHours = soshours.length > 0 ? soshours : businessHours;
    var date = new Date();
    var currentDay = date.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
    if (currentDay === 0) {
        currentDay = 7; // Adjusting Sunday to 7th position
    }
    var currentTime = date;
    var isBusinessHour = false;
    // loop through the business hours to find the current day
    for (var i = 0; i < selectedWorkingHours.length; i++) {
        if (parseInt(selectedWorkingHours[i].id) === currentDay) {
            // only check the hours if the day is active
            if (selectedWorkingHours[i].active === '1') {
                // create Date objects for startTime and endTime
                var [startHours, startMinutes] = selectedWorkingHours[i].startTime.split(':').map(Number);
                var [endHours, endMinutes] = selectedWorkingHours[i].endTime.split(':').map(Number);
                var startTime = new Date();
                startTime.setHours(startHours, startMinutes);
                var endTime = new Date();
                endTime.setHours(endHours, endMinutes);
                if (currentTime <= endTime) {
                    isBusinessHour = true;
                }
            }
            break;
        }
    }
    return isBusinessHour;
}

function print_available_appointments(date){
    $('#freeAppointments').html('<span class="loader"></span>').css('display', 'flex').css('height', '100%');
    print_available_appointments_loader(date);
}

function print_available_appointments_new(date) {
    let today = new Date();
    const fullDate = today.toISOString().slice(0, 10);
    if (fullDate === date) {
        if (checkIfBusinessHours(formData.businessHours,formData.sosHours) === false) {
            $('#freeAppointments').html('<div class="col-lg-12" style="text-align: center;font-size: 20px;margin-top: auto;margin-bottom: auto;"> <div style="font-size: 90px;">😥</div>'+(renderLang() === "el" ? "Συγγνώμη! Είμαστε κλειστά τώρα. Επιλέξτε μια διαφορετική ημέρα και κλείστε το ραντεβού σας" : "Sorry! We are closed now. Select a different day and book your appointment")+'</div>');
            return false;
        }
    }
    if(typeof formData['selectedBarber']['id'] !== "undefined"){
        var selectedBarber = {
            selectedBarberData:{
                id: formData['selectedBarber'].id,
                name: formData['selectedBarber'].name,
            }
        };
    }else{
        var selectedBarber = false;
    }

    if(formData.serviceTypeSelected === 'outcall'){
        var clientLocationData = {
            arithmos: formData['locationInfos'].arithmos,
            latitude: formData['locationInfos'].latitude,
            longitude: formData['locationInfos'].longitude,
            odos: formData['locationInfos'].odos,
            perioxh: formData['locationInfos'].perioxh,
            polh: formData['locationInfos'].polh,
            xwra: formData['locationInfos'].xwra,
            servicesSelected: formData['selectedServices']
        };
    }else{
        var clientLocationData = {};
    }
    clean_state_cache('selectedAppointment');
    $.ajax({
        url: "https://api.datelly.com",
        type: "POST",
        data: {
            action: 'getRecourcesForSchedule',
            date: date,
            barber: selectedBarber,
            services: formData.selectedServices,
            categoryTypeSelected: formData.serviceTypeSelected,
            clientLocationData: clientLocationData
        },
        dataType: "json",
        success: function (data) {
            if(data.length === 0){
                $('#freeAppointments').html('<div class="col-lg-12" style="text-align: center;font-size: 20px;margin-top: auto;margin-bottom: auto;"> <div style="font-size: 90px;">🙏</div>'+(renderLang() === "el" ? "Συγγνώμη! Είμαστε πλήρεις για σήμερα. Επιλέξτε μια διαφορετική ημέρα και κλείστε το ραντεβού σας" : "Sorry! We are full for today. Select a different day and book your appointment")+'</div>');
                return false;
            }
            var exportation = '';
            if(formData.serviceTypeSelected === 'outcall'){
                var selectedMessage = renderLang() === "el" ? "Για τις διαθέσιμες θέσεις ραντεβού, έχουμε ήδη υπολογίσει το χρόνο μεταφοράς μετ' επιστροφής. Οι χρόνοι που εμφανίζονται είναι οι πραγματικοί χρόνοι ραντεβού" : "For the available appointment slots, we have already calculated the round-trip transfer time. The times shown are the actual appointment times";
                var infobox = '<div id="toast-container" class="toast-top-right" aria-live="polite" role="alert" style="z-index: 0;position: relative;top: 0px;left: 0px;margin-bottom: 30px;padding: 0px;"><div class="toast toast-success" style="width: 100%;background-color: #66339921;font-style: italic;-moz-box-shadow: 0 0 12px #999;-webkit-box-shadow: 0 0 12px #999;box-shadow: 0 0 12px #663399b5;"><div class="toast-message">'+ selectedMessage +'</div></div></div>';
            }else{
                var infobox = '';
            }
            for (var i = 0; i <= data.length - 1; i++) {
                var sosSpan = '';
                if(data[i].isSos){
                    sosSpan = '<span class="sosBadge">SOS</span>';
                }
                if (data[i].free) {
                    if(data[i].travelTime > 0){
                        exportation += '<div class="'+ (data[i].isSos === true ? "isSos" : "mt-10 freeAppointment") +'">'+ sosSpan +'<div class="'+ (data[i].isSos === true ? "freeAppointment2" : "") +'"  data-starttime="' + data[i].start + '" data-ondate="'+ date +'" data-endtime="' + data[i].end + '" data-issos="'+ (data[i].isSos === true) +'">' + data[i].startPreview + ' - ' + data[i].endPreview + '</div></div>';
                    }else{
                        exportation += '<div class="'+ (data[i].isSos === true ? "isSos" : "mt-10 freeAppointment") +'">'+ sosSpan +'<div class="'+ (data[i].isSos === true ? "freeAppointment2" : "") +'"  data-starttime="' + data[i].start + '" data-ondate="'+ date +'" data-endtime="' + data[i].end + '" data-issos="'+ (data[i].isSos === true) +'">' + data[i].start + ' - ' + data[i].end + '</div></div>';
                    }
                } else {
                    exportation += '<div class="'+ (data[i].isSos === true ? "isSosDisabled" : "mt-10 reservedAppointment") +'">'+ sosSpan +'<div class="'+ (data[i].isSos === true ? "reservedAppointment2" : "") +'">' + data[i].start + ' - ' + data[i].end + '</div></div>';
                }
            }
            $('#freeAppointments').html(infobox + exportation).css('display', 'block');
        }
    });
}

function formatTime(minutes, language) {
    var hours = Math.floor(minutes / 60);
    var mins = minutes % 60;

    var hourText = language === 'el' ? 'ώρα' : 'hr';
    var hoursText = language === 'el' ? 'ώρες' : "hr's";
    var minText = language === 'el' ? 'λεπτό' : 'min';
    var minsText = language === 'el' ? 'λεπτά' : "min's";

    var result = '';

    if (hours > 0) {
        result += hours + (hours > 1 ? ' ' + hoursText : ' ' + hourText);
        if (mins > 0) {
            result += ' ' + (language === 'el' ? '&' : '&') + ' ';
        }
    }

    if (mins > 0) {
        result += mins + (mins > 1 ? ' ' + minsText : ' ' + minText);
    }

    return result;
}

function fake_loader_remove(){
    setTimeout(function(){
        remove_loader();
    },200);
}

function getSelectedServices() {
    const checkboxes = document.querySelectorAll('.serviceSelector');
    let selectedServices = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedServices.push(checkbox.id);
        }
    });
    return selectedServices;
}

function render_bottom_menu(){
    if(screen.width < '999'){
        $('#bottomMenu').html(
            '<div class="buttonsContainer">' +
            '<div class="categoryAndServicesSelectionScreen controls w-100ma"></div>' +
            '<div class="barberSelectionScreen controls w-100ma"></div>' +
            '<div class="locationTrackScreen controls w-100ma"></div>' +
            '<div class="hourSelectionScreen controls w-100ma"></div>' +
            '<div class="bookScreen controls w-100ma"></div>' +
            '</div>' +
            '           <div class="bottom-menu">' +
            '             <div class="lang-custom-selector"></div>' +
            '            <div class="line"></div>' +
            '            <div class="icon"><i class="fa fa-info-circle"></i></div>' +
            '            <div class="icon"><i class="fa fa-qrcode"></i></div>' +
            '            <div class="icon main-icon" style=""><i class="fa fa-calendar-plus-o"></i></div>' +
            '            <div class="icon"><i class="fa fa-user"></i></div>' +
            '            <div class="langCont">' +
            '    <div class="lang-selector">' +
            '        <div id="selected-lang-img-cont"></div>' +
            '    </div>' +
            '           </div>' +
            '            </div>');
        var lastScrollTop = 0;

        window.onscroll = function() {
            var st = window.pageYOffset || document.documentElement.scrollTop;
            if (st > lastScrollTop){
                // downscroll
                $(".bottom-menu").css("marginBottom", "-58px");
                $(".buttonsContainer").css("marginBottom", "-58px");
            } else {
                // upscroll
                $(".bottom-menu").css("marginBottom", "0px");
                $(".buttonsContainer").css("marginBottom", "0px");
            }
            lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
        };

        // Reset bottom property of the menu when the main icon is clicked
        $(".main-icon").click(function() {
            $(".bottom-menu").css("marginBottom", "0px");
            $(".buttonsContainer").css("marginBottom", "0px");
        });
    }else{
        $('#side-menu').html(
            '<div class="buttonsContainer">' +
            '<div class="categoryAndServicesSelectionScreen controls w-100ma"></div>' +
            '<div class="barberSelectionScreen controls w-100ma"></div>' +
            '<div class="locationTrackScreen controls w-100ma"></div>' +
            '<div class="hourSelectionScreen controls w-100ma"></div>' +
            '<div class="bookScreen controls w-100ma"></div>' +
            '</div>' +
            '           <div class="bottom-menu">' +
            '             <div class="lang-custom-selector"></div>' +
            '            <div class="line"></div>' +
            '            <div class="icon"><i class="fa fa-info-circle"></i></div>' +
            '            <div class="icon"><i class="fa fa-qrcode"></i></div>' +
            '            <div class="icon main-icon" style=""><i class="fa fa-calendar-plus-o"></i></div>' +
            '            <div class="icon"><i class="fa fa-user"></i></div>' +
            '            <div class="langCont">' +
            '    <div class="lang-selector">' +
            '        <div id="selected-lang-img-cont"></div>' +
            '    </div>' +
            '           </div>' +
            '            </div>');

        $('#deskLangCont').html('<ul class="nav navbar-top-links navbar-right customNavbar" style="position: absolute;right: 40px;top: -30px;z-index: 9;">' +
            '                       <div class="langCont">' +
            '                           <div class="lang-selector">' +
            '                               <div id="selected-lang-img-cont"></div>' +
            '                           </div>' +
            '<div class="lang-custom-selector"></div>' +
            '                       </div>' +
            ' </ul>');


        $('#side-menu').html('<li>' +
            '                    <img alt="image" class="rounded-circle" src="/images/branding/DBlogo.png" style="width: 100%;padding: 30px;">' +
            '                </li>'+
        '                    <li>' +
            '                    <div class="icon deskIcon desk-main-icon main-icon"><i class="fa fa-calendar-plus-o"></i>'+(renderLang() === "el" ? "Κλείστε ραντεβού" : " Book Appointment")+'</div>' +
            '                </li>' +
            '                <li>' +
            '                    <div class="icon deskIcon"><i class="fa fa-info-circle"></i>'+(renderLang() === "el" ? "Πληροφορίες" : "Infos")+'</div>' +
            '                </li>' +
            '                <li>' +
            '                    <div class="icon deskIcon"><i class="fa fa-qrcode"></i>'+(renderLang() === "el" ? "Κωδικός QR" : "QR Code")+'</div>' +
            '                </li>' +
            '                <li>' +
            '                   <div class="icon deskIcon"><i class="fa fa-user"></i>'+(renderLang() === "el" ? "Ιστορικό χρήστη" : "User History")+'</div>' +
            '                </li>');
    }
}

function remove_side_menu(){
    $('.navbar-default').remove();
    $('#page-wrapper').css('margin','0px');
    $('#navIcon').remove();
}

function clearLocalStorage() {
    localStorage.clear();
}

function updateLocalStorage(appointment,userStorageData,extraData){
    if(appointment !== ''){
        let appointments = JSON.parse(localStorage.getItem('appointments'));
        if (!Array.isArray(appointments)) {
            appointments = []; // Initialize as empty array if not already an array
        }
        appointments.push(appointment); // Add the new appointment object to the appointments array
        localStorage.setItem('appointments', JSON.stringify(appointments)); // Save the updated appointments array to local storage
    }
    if(userStorageData !== ''){
        let users = JSON.parse(localStorage.getItem('users'));
        if (!Array.isArray(users)) {
            users = []; // Initialize as empty array if not already an array
        }
        let existingUser = null;
        for (let i = 0; i < users.length; i++) {
            if (users[i].clientPhone === extraData) { //client phone
                existingUser = users[i];
                break;
            }
        }
        if (existingUser) {
            // Update the existing user with the new data
            Object.assign(existingUser, userStorageData);
        } else {
            // Add the new user to the users array
            users.push(userStorageData);
        }
        localStorage.setItem('users', JSON.stringify(users)); // Save the updated users array to local storage
    }
}

function vibrateWithSkypePattern() {
    if (cancelVibration) {
        // Cancel the vibration
        navigator.vibrate(0);
        return;
    }
    vibrationActivated = true;

    var pattern = [
        { duration: 50, pause: 80 },   // Vibration for 200ms, followed by a pause for 200ms
        { duration: 100, pause: 1770 },   // Repeat the pattern for 3 times (total duration: 1200ms)
    ];

    var index = 0;
    var duration = pattern[index].duration;

    // Start the vibration
    navigator.vibrate(duration);

    // Schedule the next frame
    setTimeout(function() {
        index = (index + 1) % pattern.length;

        // Continue the vibration if not canceled
        if (!cancelVibration) {
            duration = pattern[index].duration;
            navigator.vibrate(duration);

            // Schedule the next frame
            setTimeout(vibrateWithSkypePattern, duration + pattern[index].pause);
        }
    }, duration + pattern[index].pause);
}

function saveAppointment(){
    $('.preSaveButton').removeClass('saveAppointment').text((renderLang() === "el" ? "Κράτηση..." : "Booking..."));
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var place = urlParams.get('keyl');
    var clientName = document.querySelector('#name') ? $('#name').val() : null;
    var clientSurname = document.querySelector('#surname') ? $('#surname').val() : null;
    if (clientName && clientName.includes(' ')) {
        var nameParts = clientName.split(' ');
        clientName = nameParts[0];
        clientSurname = nameParts.slice(1).join(' ');
    }
    var clientEmail = document.querySelector('#email') ? $('#email').val() : null;
    var clientPhone = document.querySelector('#phone') ? $('#phone').val() : null;
    var odos = document.querySelector('#odos') ? document.getElementById('odos').value : null;
    var arithmos = document.querySelector('#arithmos') ? document.getElementById('arithmos').value : null;
    var polh = document.querySelector('#polh') ? document.getElementById('polh').value : null;
    var xwra = document.querySelector('#xwra') ? document.getElementById('xwra').value : null;
    var tk = document.querySelector('#perioxh') ? document.getElementById('perioxh').value : null;
    var orofos = document.querySelector('#orofos') ? document.getElementById('orofos').value : null;
    var lng = document.querySelector('#longitude') ? document.getElementById('longitude').value : null;
    var lat = document.querySelector('#latitude') ? document.getElementById('latitude').value : null;
    var note = document.querySelector('#note') ? document.getElementById('note').value : null;
    var appointmentInfos = {
        endTime: formData['selectedAppointmentInfos'].endTime ?? 0,
        isSos: formData['selectedAppointmentInfos'].isSos ?? 0,
        startTime: formData['selectedAppointmentInfos'].startTime ?? 0,
        onDate: formData['selectedAppointmentInfos'].onDate ?? 0,
    };
    const appointment = {
        services: formData.selectedServices,
        barberName: formData.selectedBarber.name,
        barberIcon: formData.selectedBarber.iconPath+formData.selectedBarber.icon,
        haircutPrice: formData.haircutInfos.sumPrice,
        servicesPrice:formData.haircutInfos.extraData.servicesPrice,
        disatancePrice:formData.haircutInfos.extraData.distancePrice,
        haircutTime: formData.haircutInfos.sumTime,
        sosPercentage: formData.haircutInfos.sosPercentage,
        timePreviewSlot: formData.selectedAppointmentInfos.durationTimeText,
        appointmentInfos: appointmentInfos,
        odos: odos,
        arithmos: arithmos,
        polh: polh,
        xwra: xwra,
        tk: tk,
        orofos: orofos,
        lng: lng,
        lat: lat,
        keyl: place,
        note: note,
    };

    const userStorageData = {
        clientName: clientName,
        clientSurname: clientSurname,
        clientEmail: clientEmail,
        clientPhone: clientPhone,
        odos: odos,
        arithmos: arithmos,
        polh: polh,
        xwra: xwra,
        tk: tk,
        orofos: orofos,
        keyl: place,
    };

    var request = function(){
        $.ajax({
            type: "POST",
            url: "https://api.datelly.com",
            data: {
                action: "saveAppointment",
                services: formData.selectedServices,
                barberId: formData.selectedBarber.id,
                clientName: clientName,
                clientSurname: clientSurname,
                clientEmail: clientEmail,
                clientPhone: clientPhone,
                odos: odos,
                arithmos: arithmos,
                polh: polh,
                xwra: xwra,
                tk: tk,
                orofos: orofos,
                lng: lng,
                lat: lat,
                appointmentInfos: appointmentInfos,
                lang: renderLang(),
                keyl: place,
                note: note,
            },
            success: function(response) {
                response = JSON.parse(response);
                if(response.response === 'Waiting sos response...'){
                    //timout with recurring request
                    if($('#sosWrapper').html().length === 0) {
                        vibrateWithSkypePattern();
                        window.onbeforeunload = function() {
                            return renderLang() === 'el' ? 'Έχετε μια αίτηση κράτησης σε εκκρεμότητα, περιμένετε την απάντηση και μην κλείσετε την εφαρμογή.' : 'You have a pending booking application, please wait for response and don\'t close the app';
                        };
                        var exportedHtml =
                            '<div id="loadingSos">' +
                            '<div class="call-animation">' +
                            '<img class="img-circle" src="'+ formData.selectedBarber.iconPath + formData.selectedBarber.icon +'" alt="" width="135"/>' +
                            '</div>' +
                            '    <div style="width: 320px;margin-top: 60px;">' +
                            '        <h1 style="font-size: 25px;font-weight: 500;">'+ (renderLang() === "el" ? "Αναμονή για επιβεβαίωση" : "Waiting for confirmation") +'</h1>' +
                            '        <p>'+ (renderLang() === "el" ? "Μήν κλείσεις την εφαρμογή. Ο/Η "+ formData.selectedBarber.name +" θα αποδεχτεί την κράτηση σου στα επόμενα λεπτά" : "Do not close the app. "+ formData.selectedBarber.name +" will accept your reservation in the next few minutes") +'</p>' +
                            '    </div>' +
                            '</div>';
                        $('#sosWrapper').html(exportedHtml).css('display','flex');
                        $('html, body').scrollTop(0);
                        $('html').attr('style', 'overflow: auto !important');
                        $('#wrapper').addClass('minimizeH');
                    }
                    setTimeout(request, 3000);
                }else if(response.response && !response.errorMessage){
                    /* setTimeout(function() {
                         showInstallPromotion();
                     }, 3000);*/
                    if(vibrationActivated){
                        cancelVibration = true;
                    }
                    window.onbeforeunload = null;
                    var locationMapRender = '';
                    if (formData.locationInfos.odos){
                        var locationMapRender = '<div class="ibox ibox-content" style="display: flex;border-radius: 10px;margin-top: -10px;">' +
                            '                       <img style="width: 30%;border-radius: 10px;" src="'+ $('#mapImage').val() +'">' +
                            '                       <img style="width: 27%;position: absolute;border-radius: 100%;" src="'+ $('#mapMarker').val() +'">' +
                                                    '<div style="margin: auto;padding-left: 20px;">📍 '+ formData.locationInfos.odos + ' ' + formData.locationInfos.arithmos + ', ' + formData.locationInfos.polh +', '+ formData.locationInfos.xwra +', '+ formData.locationInfos.perioxh +'</div>' +
                            '                   </div>';
                    }
                    var noteFromServiceProvider = response.response;
                    var serviceNoteHtml = '';
                    if(noteFromServiceProvider !== 'no msg'){
                        serviceNoteHtml =   '<div id="toast-container" class="toast-top-right col-lg-12 finalMessageFix" aria-live="polite" role="alert" style="z-index: 0;position: relative; top: 0px;left: 0px;margin-top: 30px;margin-bottom: 30px;">' +
                                            '     <div class="toast toast-info toastrCustom">' +
                                            '       <div class="toastr-customIcon"><img src="'+ formData.selectedBarber.iconPath + formData.selectedBarber.icon +'"></div>' +
                                            '       <div class="toast-message">'+ noteFromServiceProvider +'</div>' +
                                            '      </div>' +
                                            ' </div>';
                    }
                    $('#sosWrapper').html('').css('display','none');
                    var extraHtml = '' +
                        '<div class="ibox" style="box-shadow: 0px 0px 40px -20px black;margin: auto;padding-bottom: 1px;">' +
                        '<div style="width:100%;height: 100px;display: flex;">' +
                        '<div class="icon icon--order-success svg" style="margin: auto;">' +
                        '          <svg xmlns="http://www.w3.org/2000/svg" width="72px" height="72px">' +
                        '            <g fill="none" stroke="#0a9465" stroke-width="2">' +
                        '              <circle cx="36" cy="36" r="35" style="stroke-dasharray:240px, 240px; stroke-dashoffset: 480px;"></circle>' +
                        '              <path d="M17.417,37.778l9.93,9.909l25.444-25.393" style="stroke-dasharray:50px, 50px; stroke-dashoffset: 0px;"></path>' +
                        '            </g>' +
                        '          </svg>' +
                        ' </div>' +
                        '</div>' +
                        '<div class="ibox">' +
                        '    <h1 style="margin: 0px;text-align: center">'+ (renderLang() === "el" ? "Επιτυχής κράτηση!" : "Successfully booked!") +'</h1>' +
                        '</div>' + serviceNoteHtml +
                        '</div>';
                    var extraButtonHtml = '<div class="ibox" style="padding: 70px 10px 20px 10px;margin-top: -70px;box-shadow: 0px 20px 40px -20px black;border-radius: 10px;">' +
                        '                      <button class="btn customButton" id="sameAppNew" style="width: 100%;font-size: 15px;">'+ (renderLang() === "el" ? "Κλείστε παρόμοιο ραντεβού" : "Book a similar appointment") +'</button> ' +
                        '</div>';
                    var previewBoxFinal = '<div class="ibox" style="box-shadow: 0px 0px 40px -20px black;"><div class="ibox-content" style="display: flex;border-top-left-radius: 10px;border-top-right-radius: 10px"><div class="row previewBoxFinal" style="margin: 0px;background-color: #242424;border-radius: 10px;"> '+$(".previewBoxFinal").html()+'</div></div></div>';
                    $('#finishScreen').html(extraHtml+previewBoxFinal+locationMapRender+extraButtonHtml).css('display','block');
                    $('.mainUsageScreen:has(.bookScreen)').css('display','none');
                    $('.mainUsageScreen:has(#finishScreen)').css('display','block');
                    $('.bookScreen.controls').css('display','none');
                    $('.preSaveButton').addClass('saveAppointment').text((renderLang() === "el" ? "Κράτηση" : "Book"));
                    $('.removeTitle').remove();
                    updateLocalStorage(appointment,userStorageData,clientPhone);
                    $('html, body').scrollTop(0);
                    $('html').removeAttr('style');
                    $('#wrapper').removeClass('minimizeH');
                    update_data_center('hasClosedAppointment',true);
                }else{
                    if(vibrationActivated){
                        cancelVibration = true;
                    }
                    window.onbeforeunload = null;
                    $('#sosWrapper').html('').css('display','none');
                    $('.preSaveButton').addClass('saveAppointment').text((renderLang() === "el" ? "Κράτηση" : "Book"));
                    if(response.errorMessage === 'requestCanceled'){
                        var title = renderLang() === "el" ? "Το ραντεβού σας ακυρώθηκε" : "Your appointment canceled";
                        var text = response.response;
                        swal({
                            title: title,
                            text: text,
                            type: "error",
                            showCancelButton: false,
                            showConfirmButton: true,
                            showConfirmButtonText: 'Ok',
                            customClass: "customSwallClass"
                        });
                    }else{
                        if(response.errorMessage){
                            var title = response.errorMessage;
                        }else{
                            var title ='Error on send appointment! please contact us';
                        }
                        var text = '';
                        for (var j = 0; j <= response.missingFields.length-1; j++) {
                            if(response.missingFields[j] === 'clientName'){
                                text += 'Name';
                            }
                            if(response.missingFields[j] === 'clientSurname'){
                                text += 'Surname';
                            }
                            if(response.missingFields[j] === 'clientPhone'){
                                text += 'Phone';
                            }
                            if(j !== response.missingFields.length-1){
                                text += ', '
                            }
                        }
                        swal({
                            title: title,
                            text: text,
                            type: "error",
                            showCancelButton: false,
                            showConfirmButton: true,
                            showConfirmButtonText: 'Ok',
                            customClass: "customSwallClass"
                        },(function() {
                            $('.preSaveButton').addClass('saveAppointment').text((renderLang() === "el" ? "Κράτηση" : "Book"));
                            if(response.missingFields){
                                $('#name').removeClass('requiredInput');
                                $('#surname').removeClass('requiredInput');
                                $('#email').removeClass('requiredInput');
                                $('#phone').removeClass('requiredInput');
                                var meter = 0;
                                for (var i = 0; i <= response.missingFields.length-1; i++) {
                                    if(response.missingFields[i] === 'clientName'){
                                        $('#name').addClass('requiredInput');
                                        meter++;
                                        setTimeout(function(){
                                            $("#name").focus();
                                        },100);
                                    }
                                    if(response.missingFields[i] === 'clientSurname'){
                                        $('#surname').addClass('requiredInput');
                                        if(meter <= 0){
                                            setTimeout(function() {
                                                $("#surname").focus();
                                            },100);
                                            meter++;
                                        }
                                    }
                                    if(response.missingFields[i] === 'clientEmail'){
                                        $('#email').addClass('requiredInput');
                                        if(meter <= 0){
                                            setTimeout(function() {
                                                $("#email").focus();
                                            },100);
                                            meter++;
                                        }
                                    }
                                    if(response.missingFields[i] === 'clientPhone'){
                                        $('#phone').addClass('requiredInput');
                                        if(meter <= 0){
                                            setTimeout(function() {
                                                $("#phone").focus();
                                            },100);
                                            meter++;
                                        }
                                    }
                                }
                            }
                        }));
                    }
                    $('html, body').scrollTop(0);
                    $('html').removeAttr('style');
                    $('#wrapper').removeClass('minimizeH');
                }
            }
        });
    };
    request();
}
/**
 * Tool functions end
 * */


/**
 * Map relative functions start
 * **/
function errorLocation() {
    if (renderLang() === 'el') {
        var title = 'Απαιτείται άδεια τοποθεσίας';
        var text = 'Για να κλείσετε ένα ραντεβού στο χώρο σας πρέπει να επιτρέψετε την προβολή της τοποθεσίας σας και μετά να ανανεώσετε τη σελίδα.';
        var confirmButtonText = 'Το κατάλαβα';
        var buttonText = 'Επαναφόρτωση σελίδας';
    } else {
        var title = 'Location Permission Required';
        var text = 'In order to Book an appointment at your place you must allow permission to view your location and after refresh the page';
        var confirmButtonText = 'Understood';
        var buttonText = 'Reload Page';

    }
    swal({
        title: title,
        text: text,
        type: "error",
        showCancelButton: false,
        closeOnConfirm: true,
        confirmButtonColor: "#0c8656",
        confirmButtonText: confirmButtonText,
        customClass: "customSwallClass"
    }, function (confirmed) {
        if (confirmed) {
            setTimeout(function(){
                $('#mapLoader').html('<div class="sweet-alert customSwallClass staticSweetAlert" style="display: none;border: 0px;background-color: #ff000000!important;box-shadow: none;padding: 0px;">' +
                    '   <div class="sa-icon sa-error animateErrorIcon" style="display: block;">' +
                    '        <span class="sa-x-mark animateXMark">' +
                    '           <span class="sa-line sa-left"></span>' +
                    '           <span class="sa-line sa-right"></span>' +
                    '         </span>' +
                    '   </div>' +
                    '   <h1>'+ title+'</h1><p>'+ text +'</p><p><button onclick="window.location.reload();">'+ buttonText +'</button></p>');
                setTimeout(function(){
                    $('.staticSweetAlert').css('display','block');
                },300);
            },200);
        }
    });
}

function setupMap(center) {
    /**
     This code is a bit long, but in essence, it creates a Mapbox map with a draggable marker, adds a navigation control, and implements a long-press event to move the marker and fly the map to the new location.
     Also, it handles the address search functionality, with auto-suggestion when user types in the address input field. The suggestions are coming from Mapbox Geocoding API, and when a suggestion is clicked, the marker is moved to that location and the map is flown to it.
     For the long-press functionality, a progress circle is displayed when the user starts pressing, and it's hidden when the user stops pressing or moves the mouse (or finger on touch devices) more than a certain threshold from the initial location. This helps avoid unwanted marker moves when the user is just panning the map.
     This code is already handling both mouse and touch events, so it should work on both desktop and mobile devices.
     * */
    mapboxgl.accessToken = mapboxAccessToken;
    const map = new mapboxgl.Map({
        container: 'map',
        style: "mapbox://styles/mapbox/streets-v11",
        center: center,
        zoom: 19
    });
    const nav = new mapboxgl.NavigationControl();
    map.addControl(nav);
   var marker = new mapboxgl.Marker({
        draggable: true,
    }).setLngLat(center).addTo(map);
    map.on('load', function() {
        map.on('idle', function() {
            var canvasMap = map.getCanvas();
            var base64ImageMap = canvasMap.toDataURL("image/png");
            $('#mapImage').val(base64ImageMap);
            var mapElement = document.querySelector('#map');
            html2canvas(mapElement).then(function(canvas) {
                var base64Image = canvas.toDataURL("image/png");
                $('#mapMarker').val(base64Image);
            });
        });
    });
    var pressTimer;
    var longPressDuration = 600; // 700 ms = 0.7 second
    var progressCircle = document.getElementById('progressCircle');
    var progressCirclePath = document.getElementById('progressCirclePath');
    var initialPoint;
    ['mousedown', 'touchstart'].forEach(evtName => {
        map.on(evtName, function(e) {
            if(evtName === 'touchstart'){
                if (e.originalEvent.touches.length > 1) {
                    // More than one finger touched so not a single tap
                    return;
                }
            }
            // If the circle is already visible or the user is dragging, don't do anything
            if (progressCircle.style.display === 'block') {
                return;
            }
            // Record the initial coordinates
            initialPoint = e.point;
            // Show and position the progress circle at the event location
            progressCircle.style.left = (e.point.x - 50) + 'px'; // Adjust these values as needed to center the circle
            progressCircle.style.top = (e.point.y - 50) + 'px';
            progressCircle.style.opacity = 1;
            setTimeout(function(){
                progressCircle.style.display = 'block';
            },400);
            // Start the circle animation
            progressCirclePath.style.strokeDashoffset = 0;
            // Start a timer
            pressTimer = window.setTimeout(function() {
                // When timer ends, move the marker
                navigator.vibrate(300);
                marker.setLngLat(e.lngLat);
                map.flyTo({center: e.lngLat});
                reverseGeocode(e.lngLat.lng,e.lngLat.lat);
                // Hide the progress circle
                progressCircle.style.opacity = 0;
                progressCirclePath.style.strokeDashoffset = '282.7433';
                setTimeout(function() {
                    progressCircle.style.display = 'none';
                }, 300);
            }, longPressDuration);
        });
    });
    ['mousemove', 'touchmove'].forEach(evtName => {
        map.on(evtName, function(e) {
            // If the circle is not visible or the user is not dragging, don't do anything
            if (progressCircle.style.display !== 'block') {
                return;
            }
            // If the current coordinates differ from the initial ones by more than a certain threshold, hide the circle and clear the timer
            var moveThreshold = 10; // Change this value to increase or decrease the movement threshold
            if (Math.abs(e.point.x - initialPoint.x) > moveThreshold || Math.abs(e.point.y - initialPoint.y) > moveThreshold) {
                progressCircle.style.opacity = 0;
                progressCirclePath.style.strokeDashoffset = '282.7433';
                setTimeout(function() {
                    progressCircle.style.display = 'none';
                }, 300);
                clearTimeout(pressTimer);
            }
        });
    });
    ['mouseup', 'touchend'].forEach(evtName => {
        map.on(evtName, function() {
            // If the mouse button or touch point is released, stop the timer
            clearTimeout(pressTimer);

            // Hide the progress circle and reset the animation
            progressCircle.style.opacity = 0;
            progressCirclePath.style.strokeDashoffset = '282.7433';

            setTimeout(function() {
                progressCircle.style.display = 'none';
            }, 300);
        });
    });
    let odosInput = document.getElementById('odos');
    odosInput.addEventListener('input', debounce(function(e) {
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(odosInput.value)}.json?access_token=${mapboxgl.accessToken}&country=GR`)
            .then(response => response.json())
            .then(data => {
                suggestionList.innerHTML = ''; // clear previous suggestions
                $('#suggestionList').css('display','block');
                if (data.features && data.features.length > 0) {
                    data.features.forEach(feature => {
                        let suggestion = document.createElement('a');
                        suggestion.textContent = feature.place_name; // update this with your preferred property
                        suggestion.classList.add('dropdown-item'); // add Bootstrap dropdown item class
                        suggestion.href = '#'; // needed for a link
                        suggestion.addEventListener('click', function(e) {
                            e.preventDefault();
                            renderMapInputs_data_center(feature,marker,map);
                            $('#suggestionList').css('display','none');
                        });
                        suggestionList.appendChild(suggestion);
                    });
                }
            })
            .catch(error => console.error('Error:', error));
    }, 1000)); // reduced debounce time for a smoother autocomplete experience
    remove_loader();
}

function renderMapInputs_data_center(feature,marker,map){
    var place = feature;
    let coordinates = place.center;
    marker.setLngLat(coordinates);
    map.flyTo({center: coordinates});
    // Create an object with the data
    var locationData = {
        odos: place.text || '',
        arithmos: place.address || '',
        longitude: coordinates[0],
        latitude: coordinates[1],
        perioxh: '',
        polh: '',
        xwra: ''
    };
    var context = place.context;
    context.forEach((item) => {
        switch (item.id.split('.')[0]) {
            case 'postcode':
                locationData.perioxh = item.text;
                break;
            case 'place':
                locationData.polh = item.text;
                break;
            case 'country':
                locationData.xwra = item.text;
                break;
        }
    });
    update_data_center('locationInfos', locationData);
    // Add the data to the corresponding elements
    document.getElementById("odos").value = locationData.odos;
    document.getElementById("arithmos").value = locationData.arithmos;
    document.getElementById("longitude").value = locationData.longitude;
    document.getElementById("latitude").value = locationData.latitude;
    document.getElementById("perioxh").value = locationData.perioxh;
    document.getElementById("polh").value = locationData.polh;
    document.getElementById("xwra").value = locationData.xwra;
}

function setupStoreMap(center) {
    render_map_box_lib();
    setTimeout(function(){
        mapboxgl.accessToken = mapboxAccessToken;
        const map = new mapboxgl.Map({
            container: 'storeMap',
            style: "mapbox://styles/mapbox/streets-v11",
            center: center,
            zoom: 16
        });
        const nav = new mapboxgl.NavigationControl();
        map.addControl(nav);
        var marker = new mapboxgl.Marker({
            draggable: false
        }).setLngLat(center).addTo(map);
        // Get the button-container element
        var buttonContainer = document.getElementById('button-container');

        // Add onclick event listener to the button-container
        buttonContainer.addEventListener('click', function() {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${center[1]},${center[0]}`);
        });
        $('.mapboxgl-marker').html('<img src="images/barbers/'+ formData.businessLogo +'" style="width: 26px;height: 26px;border-radius:100%;margin-left: 7px;margin-top: 2px;">');
        remove_loader();
    },500);
}

function setupMapForm(){
    var selectedMessage = renderLang() === "el" ? "Σε περίπτωση λανθασμένης τοποθεσίας διαθέσιμες επιλογές: <br><br> * Σύρετε και αφήστε το marker στην επιθυμητή θέση. <br> * Πιέστε παρατεταμένα πάνω στον χάρτη στο επιθυμητό σημείο <br>* Ή εισαγάγετε τις πληροφορίες σας και ο χάρτης θα εντοπίσει αυτόματα την εισαγόμενη διεύθυνση." : "In case of a wrong location available options: <br><br>* Tap and hold any point.<br>* Drag and drop the marker to the desired position.<br>* Enter your information and the map will automatically locate the entered address.";
    var exportedHtml = '<div class="ibox" style="box-shadow: 0px 0px 40px -20px black;">' +
        '                    <div class="ibox-title" style="border-bottom: 1px solid #424242!important;">' +
        '                        <h5>Your Location</h5>' +
        '                    </div>' +
        '                    <div class="ibox-content" style="min-height: 0px;">' +
        '                        <form class="row" style="margin-bottom: 30px;">' +
        '                            <div class="col-lg-12 col-sm-12" style="padding-left: 15px!important;padding-right: 15px!important;">' +
        '                                <div class="form-group" style="margin-bottom: 0px">' +
        '                                    <label for="odos" style="margin-bottom: -5px;background-color: #2d2d2d;padding-left: 5px;padding-right: 5px;margin-left: 10px;z-index: 1;position: relative;"><span style="font-size: 12px!important;">Οδός</span></span></label>' +
        '                                    <div class="dropdown">' +
        '                                       <input type="text" oninput="inputValidation(this)" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" data-required="false" class="form-control toFillInput" id="odos" placeholder="" style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;" autocomplete="off">' +
        '                                       <div class="dropdown-menu" aria-labelledby="odosInput" id="suggestionList"></div>' +
        '                                    </div>' +
        '                                </div>' +
        '                            </div>' +
        '                            <div class="col-lg-6 col-sm-6">' +
        '                                <div class="form-group" style="margin-bottom: 0px">' +
        '                                    <label for="polh" style="margin-bottom: -5px;background-color: #2d2d2d;padding-left: 5px;padding-right: 5px;margin-left: 10px;"><span style="font-size: 12px!important;">Πόλη</span></label>' +
        '                                    <input type="text" oninput="inputValidation(this)" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" class="form-control toFillInput" id="polh" placeholder="" data-required="true" style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
        '                                </div>' +
        '                            </div>' +
        '                            <div class="col-lg-6 col-sm-6">' +
        '                                <div class="form-group" style="margin-bottom: 0px">' +
        '                                    <label for="xwra" style="margin-bottom: -5px;background-color: #2d2d2d;padding-left: 5px;padding-right: 5px;margin-left: 10px;"><span style="font-size: 12px!important;">Χώρα</span></label>' +
        '                                    <input type="text" oninput="inputValidation(this)" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" class="form-control toFillInput" id="xwra" placeholder="" data-required="true" style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
        '                                </div>' +
        '                            </div>' +
        '                            <div class="col-lg-3 col-sm-3">' +
        '                                <div class="form-group" style="margin-bottom: 0px">' +
        '                                    <label for="perioxh" style="margin-bottom: -5px;background-color: #2d2d2d;padding-left: 5px;padding-right: 5px;margin-left: 10px;"><span style="font-size: 12px!important;">T.K</span></label>' +
        '                                    <input type="text" oninput="inputValidation(this)" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" class="form-control toFillInput" id="perioxh" placeholder="" data-required="true" style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
        '                                </div>' +
        '                            </div>' +
        '                            <div class="col-lg-3 col-sm-3">' +
        '                                <div class="form-group" style="margin-bottom: 0px">' +
        '                                    <label for="arithmos" style="margin-bottom: -5px;background-color: #2d2d2d;padding-left: 5px;padding-right: 5px;margin-left: 10px;"><span style="font-size: 12px!important;">Αριθμός</span></label>' +
        '                                    <input type="text" oninput="inputValidation(this)" data-regex="^\\d+$" class="form-control toFillInput" id="arithmos" placeholder="" data-required="true" style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
        '                                </div>' +
        '                            </div>' +
        '                            <div class="col-lg-6 col-sm-6">' +
        '                                <div class="form-group" style="margin-bottom: 0px">' +
        '                                    <label for="orofos" style="margin-bottom: -5px;background-color: #2d2d2d;padding-left: 5px;padding-right: 5px;margin-left: 10px;"><span style="font-size: 12px!important;">Όροφος</span></label>' +
        '                                    <input type="text" oninput="inputValidation(this)" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" class="form-control toFillInput" id="orofos" placeholder="" data-required="true" style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
        '                                </div>' +
        '                            </div>' +
        '                            <input type="hidden" id="longitude">' +
        '                            <input type="hidden" id="latitude">' +
        '                            <input type="hidden" id="distanceMetered">' +
        '                            <input type="hidden" id="mapImage">' +
        '                            <input type="hidden" id="mapMarker">' +
        '                        </form>' +
        '                        <div class="col-lg-12" id="mapSelection" style="background-color: #242424;border-radius: 10px;padding: 0px;">' +
        '                            <div id="map"></div>' +
        '                            <svg id="progressCircle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="display: none; position: absolute;">' +
        '                               <circle id="progressCirclePath" cx="50" cy="50" r="45" fill="transparent" stroke="#00c853" stroke-width="10" stroke-dasharray="282.7433" stroke-dashoffset="282.7433"/>' +
        '                            </svg>' +
        '                        </div>' +
        '                    </div>' +
        '                    <div id="toast-container" class="toast-top-right col-lg-12" aria-live="polite" role="alert" style="z-index: 0;position: relative; top: 0px;left: 0px;margin-top: 30px;margin-bottom: 30px;">' +
        '                       <div class="toast toast-info toastrCustom">' +
        '                           <div class="toast-message">'+ selectedMessage +'</div>' +
        '                       </div>' +
        '                    </div>' +
        '               </div>';
    screen_renderer('locationTrackScreen',exportedHtml);
}

function reverseGeocode(lng,lat) {
    var api_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;
    fetch(api_url)
        .then(response => response.json())
        .then(data => {
            var place = data.features[0];

            // Create an object with the data
            var locationData = {
                odos: place.text || '',
                arithmos: place.address || '',
                longitude: lng,
                latitude: lat,
                perioxh: '',
                polh: '',
                xwra: ''
            };

            var context = place.context;
            context.forEach((item) => {
                switch (item.id.split('.')[0]) {
                    case 'postcode':
                        locationData.perioxh = item.text;
                        break;
                    case 'place':
                        locationData.polh = item.text;
                        break;
                    case 'country':
                        locationData.xwra = item.text;
                        break;
                }
            });
            // Pass the locationData object to the update_data_center function
            update_data_center('locationInfos', locationData);
            // Add the data to the corresponding elements
            document.getElementById("odos").value = locationData.odos;
            document.getElementById("arithmos").value = locationData.arithmos;
            document.getElementById("longitude").value = locationData.longitude;
            document.getElementById("latitude").value = locationData.latitude;
            document.getElementById("perioxh").value = locationData.perioxh;
            document.getElementById("polh").value = locationData.polh;
            document.getElementById("xwra").value = locationData.xwra;
        })
        .catch(error => console.error('error'));
}

function successLocation(position,prevScreen) {
    setupMapForm();
    getAddressFromCoords(position.coords.latitude, position.coords.longitude,prevScreen);
    setupMap([position.coords.longitude, position.coords.latitude],'map');
}

function getAddressFromCoords(Lat, lng,prevScreen) {
    mapboxgl.accessToken = mapboxAccessToken;
    var api_url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${Lat}.json?access_token=${mapboxgl.accessToken}`;
    fetch(api_url)
        .then(response => response.json())
        .then(data => {
            var place = data.features[0];
            // Create an object with the data
            var locationData = {
                odos: place.text || '',
                arithmos: place.address || '',
                longitude: lng,
                latitude: Lat,
                perioxh: '',
                polh: '',
                xwra: ''
            };
            var context = place.context;
            context.forEach((item) => {
                switch (item.id.split('.')[0]) {
                    case 'postcode':
                        locationData.perioxh = item.text;
                        break;
                    case 'place':
                        locationData.polh = item.text;
                        break;
                    case 'country':
                        locationData.xwra = item.text;
                        break;
                }
            });
            update_data_center('locationInfos', locationData);
            if (!$('.locationTrackScreen > .prevStepButton').length) {
                $('.locationTrackScreen').append(bookScreenManagement('prev','controls', 'locationTrackScreen',prevScreen));
            }
            if (
                formData.locationInfos.longitude !== '' &&
                formData.locationInfos.latitude !== '' &&
                formData.locationInfos.xwra === 'Greece'
            ) {
                if (!$('.locationTrackScreen > .nextStepButton').length) {
                    $('.locationTrackScreen').append(bookScreenManagement('next','controls', 'locationTrackScreen',prevScreen));
                }
            }else{
                $('.locationTrackScreen > .nextStepButton').remove();
            }
            // Add the data to the corresponding elements
            document.getElementById("odos").value = locationData.odos;
            document.getElementById("arithmos").value = locationData.arithmos;
            document.getElementById("longitude").value = locationData.longitude;
            document.getElementById("latitude").value = locationData.latitude;
            document.getElementById("perioxh").value = locationData.perioxh;
            document.getElementById("polh").value = locationData.polh;
            document.getElementById("xwra").value = locationData.xwra;
        })
        .catch(error => console.error('error'));
}

function validateInput(input, type) {
    var pattern = new RegExp(input.getAttribute('data-regex'));
    if (!pattern.test(input.value) && input.value.length !== 0) {
        // input value does not match the pattern
        input.style.setProperty("border", "1px solid red", "important"); // set border color to red
        var selectedMessage = renderLang() === "el" ? "Δώστε ένα έγκυρο " : "Enter a valid ";
        if(!document.getElementById(input.id + '_error')) { // if error message does not exist
            var message = document.createElement('div'); // create a div for error message
            message.id = input.id + '_error'; // give it an id
            message.className = 'invalidInput';
            message.style.color = "red"; // style it
            message.textContent = `${selectedMessage} ${input.id}!`; // set message
            input.parentNode.insertBefore(message, input); // insert it before input
            $('.preSaveButton.saveAppointment').remove();
            $('.bookScreen').append('<button class= "customButton preSaveButton saveAppointment disabled" style= "width: 48%;height: 40px;border-radius: 10px;margin-left: auto;margin-right: auto;font-size: 18px;background-color: rebeccapurple; ">'+ (renderLang() === "el" ? "Κράτηση" : "Book") +'</button>');
        }
    } else if ((type === 'phone' && input.value.length === 10 && pattern.test(input.value)) || (type !== 'phone' && pattern.test(input.value))) {
        // input value matches the pattern
        // For phone, it also checks if it's 10 digits long
        input.style.setProperty("border", "1px solid rebeccapurple", "important"); // set border color to green
        var message = document.getElementById(input.id + '_error');
        if(message) { // if error message exists
            message.remove(); // remove it
        }
    } else if (input.value.length === 0) {
        // input field is empty
        input.style.setProperty("border", "1px solid #0c8656", "important"); // set border color to red
        var message = document.getElementById(input.id + '_error');
        if(message) { // if error message exists
            message.remove(); // remove it
        }
    }
    // get all elements with class "toFillInput" in both input and textarea
    var inputs = document.querySelectorAll('input.toFillInput, textarea.toFillInput');
    var allFilled = true;
    // iterate over the elements
    for (var i = 0; i < inputs.length; i++) {
        // check if data-isrequired attribute is true and input value is empty
        // or if error message for the input exists
        if (inputs[i].getAttribute('data-isrequired') === 'true' && (inputs[i].value.trim() === '' || document.getElementById(inputs[i].id + '_error'))) {
            allFilled = false;
            break;
        }
        if (inputs[i].getAttribute('data-isrequired') === 'false' && document.getElementById(inputs[i].id + '_error')) {
            allFilled = false;
            break;
        }
    }
    // if all required inputs are filled and no errors
    if (allFilled) {
        $('.preSaveButton.saveAppointment.disabled').remove();
        if ($('.preSaveButton.saveAppointment').length === 0 && $('.preSaveButton.disabled').length >= 0) {
            $('.preSaveButton.disabled').remove();
            $('.bookScreen').append('<button class= "customButton preSaveButton saveAppointment" style= "width: 48%;height: 40px;border-radius: 10px;margin-left: auto;margin-right: auto;font-size: 18px;background-color: rebeccapurple; ">'+ (renderLang() === "el" ? "Κράτηση" : "Book") +'</button>');
        }
    } else {
        $('.preSaveButton.saveAppointment').remove();
        if ($('.preSaveButton.disabled').length === 0) {
            $('.bookScreen').append('<button class= "customButton preSaveButton saveAppointment disabled" style= "width: 48%;height: 40px;border-radius: 10px;margin-left: auto;margin-right: auto;font-size: 18px;background-color: rebeccapurple; ">'+ (renderLang() === "el" ? "Κράτηση" : "Book") +'</button>');
        }
    }
}
/**
 * Map relative functions end
 * **/

/**
 * book Screens start
 * */
function bookScreenManagement(directionOfMovement,typeOfMovement,currentScreen,moveScreen) {
    /*var test = [{
        directionOfMovement: directionOfMovement,
        typeOfMovement: typeOfMovement,
        currentScreen: currentScreen,
        moveScreen: moveScreen,
        serviceType: formData.serviceTypeSelected
    }];
    console.log(test, 'SCREEN MANAGEMENT');*/
    var exportedData = '';
    //hierarchy
    // 1. serviceTypeSelectionScreen
    // 2. categoryAndServicesSelectionScreen
    // 3. locationTrackScreen
    // 4. barberSelectionScreen
    // 5. hourSelectionScreen
    // 6. bookScreen
    var noPrevButton = false;
    var noNextButton = false;
    var prevButtonsText = renderLang() === "el" ? "Προηγούμενο βήμα" : "Previous Step";
    var nextButtonsText = renderLang() === "el" ? "Επόμενο βήμα" : "Next Step";

    //2 cases
    if (currentScreen === 'barberSelectionScreen' && moveScreen === "categoryAndServicesSelectionScreen") {
        if (directionOfMovement === 'prev') {
            if (typeOfMovement === 'controls') {
                exportedData = '<button class="customButton prevStepButton fullBut" onclick="category_and_services_selection_screen()">' + prevButtonsText + '</button>';
                noNextButton = true;
            }
        }
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'direct') {
                hour_selection_screen(currentScreen);
            }
        }
    }
    //2 cases
    if (currentScreen === 'barberSelectionScreen' && moveScreen === "locationTrackScreen") {
        if (directionOfMovement === 'prev') {
            if (typeOfMovement === 'controls') {
                exportedData = '<button class="customButton prevStepButton" onclick="location_track_screen()" style=" ">' + prevButtonsText + '</button>';
            }
        }
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'direct') {
                hour_selection_screen(currentScreen);
            }
        }
    }
    //1 case
    if (currentScreen === 'barberSelectionScreen' && moveScreen === "hourSelectionScreen") {
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'direct') {
                hour_selection_screen(currentScreen);
            }
        }
    }
    //1 case
    if (currentScreen === 'barberSelectionScreen' && !moveScreen) {
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'direct') {
                hour_selection_screen(currentScreen);
            }
        }
    }
    //2 Cases
    if (currentScreen === "locationTrackScreen" && moveScreen === 'barberSelectionScreen') {
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'controls') {
                exportedData = '<button class="customButton nextStepButton" onclick="barber_selection_screen(\'' + currentScreen + '\')" style=" ">' + nextButtonsText + '</button>';
            }
        }
        if (directionOfMovement === 'prev') {
            if (typeOfMovement === 'controls') {
                if (!formData.availableServiceTypes.selectedType) {
                    exportedData = '<button class="customButton prevStepButton" onclick="service_type_selection_screen()" style=" ">' + prevButtonsText + '</button>';
                }
            }
        }
    }
    //2 cases
    if (currentScreen === "locationTrackScreen" && moveScreen === 'categoryAndServicesSelectionScreen') {
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'controls') {
                exportedData = '<button class="customButton nextStepButton" onclick="barber_selection_screen(\'' + currentScreen + '\')" style=" ">' + nextButtonsText + '</button>';
            }
        }
        if (directionOfMovement === 'prev') {
            if (typeOfMovement === 'controls') {
                exportedData = '<button class="customButton prevStepButton" onclick="category_and_services_selection_screen()" style=" ">' + prevButtonsText + '</button>';
            }
        }
    }
    //2 case
    if (currentScreen === "locationTrackScreen" && !moveScreen) {
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'controls') {
                exportedData = '<button class="customButton nextStepButton" onclick="category_and_services_selection_screen(\'' + currentScreen + '\')" style=" ">' + nextButtonsText + '</button>';
            }
        }
        if (directionOfMovement === 'prev') {
            if (typeOfMovement === 'direct') {
                location_track_screen();
            }
        }
    }
    //1 Case
    if (currentScreen === "serviceTypeSelectionScreen" && moveScreen === "categoryAndServicesSelectionScreen") {
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'direct') {
                category_and_services_selection_screen(currentScreen);
            }
        }
    }
    //3 Cases
    if (currentScreen === "categoryAndServicesSelectionScreen" && moveScreen === "serviceTypeSelectionScreen") {
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'direct') {
                if (formData.serviceTypeSelected === 'incall') {
                    barber_selection_screen();
                } else {
                    location_track_screen('barberSelectionScreen');
                }
            }
        }
        if (directionOfMovement === 'prev') {
            if (typeOfMovement === 'controls') {
                if(!formData.availableServiceTypes.selectedType){
                    exportedData = '<button class="customButton prevStepButton" onclick="service_type_selection_screen()" style=" ">' + prevButtonsText + '</button>';
                }else{
                    noNextButton = true;
                }
            }
        }
    }
    //2 cases
    if (currentScreen === "categoryAndServicesSelectionScreen" && moveScreen === false) {
        if (directionOfMovement === 'next') {
            if (typeOfMovement === "controls") {
                if (formData.serviceTypeSelected === 'incall') {
                    exportedData = '<button class="customButton nextStepButton" onclick="barber_selection_screen(\'' + currentScreen + '\')" style=" ">' + nextButtonsText + '</button>';
                    if(formData.availableServiceTypes.selectedType){
                        noPrevButton = true;
                    }
                } else {
                    exportedData = '<button class="customButton nextStepButton" onclick="location_track_screen(\'' + currentScreen + '\')" style=" ">' + nextButtonsText + '</button>';
                }
            }
        }
    }
    //4 cases
    if (currentScreen === "hourSelectionScreen" && moveScreen === 'barberSelectionScreen') {
        if (directionOfMovement === 'prev') {
            if (typeOfMovement === 'controls') {
                if (formData.serviceTypeSelected === 'incall') {
                    if(formData.availableBarbers.length === 1 && formData.availableServices.length > 1){
                        exportedData = '<button class="customButton prevStepButton" onclick="category_and_services_selection_screen()" style=" ">' + prevButtonsText + '</button>';
                    }
                    if(formData.availableBarbers.length > 1){
                        exportedData = '<button class="customButton prevStepButton" onclick="barber_selection_screen(\'' + currentScreen + '\')" style=" ">' + prevButtonsText + '</button>';
                    }

                } else {
                    if(formData.availableBarbers.length === 1){
                        exportedData = '<button class="customButton prevStepButton" onclick="location_track_screen(\'' + currentScreen + '\')" style=" ">' + prevButtonsText + '</button>';
                    }
                    if(formData.availableBarbers.length > 1){
                        exportedData = '<button class="customButton prevStepButton" onclick="barber_selection_screen(\'' + currentScreen + '\')" style=" ">' + prevButtonsText + '</button>';
                    }
                }
            }
        }
    }
    //1 case
    if(currentScreen === 'hourSelectionScreen' && moveScreen === 'bookScreen'){
        if (directionOfMovement === 'next') {
            if (typeOfMovement === 'controls') {
                exportedData = '<button class="customButton nextStepButton" onclick="book_screen(\'' + currentScreen + '\')" style=" ">' + nextButtonsText + '</button>';
                noPrevButton = true;
            }
        }
    }
    //1 case
    if(currentScreen === 'bookScreen' && moveScreen === 'hourSelectionScreen'){
        if (directionOfMovement === 'prev') {
            if (typeOfMovement === 'controls') {
                exportedData = '<button class="customButton prevStepButton" onclick="hour_selection_screen(\'' + moveScreen + '\')" style=" ">' + prevButtonsText + '</button>';
                exportedData += '<button class= "customButton preSaveButton saveAppointment disabled" style= "width: 48%;height: 40px;border-radius: 10px;margin-left: auto;margin-right: auto;font-size: 18px;background-color: rebeccapurple; ">'+ (renderLang() === "el" ? "Κράτηση" : "Book") +'</button>';
                noNextButton = true;
            }
            if (typeOfMovement === 'direct') {
                hour_selection_screen(moveScreen);
                noNextButton = true;
            }
        }
    }

    if(directionOfMovement === 'next' && !noPrevButton){
       var prevButtonsSelected = '<button class="customButtonDisabled prevStepButtonDisabled">' + prevButtonsText + '</button>';
        var finalExport = prevButtonsSelected + exportedData;

    }else if(directionOfMovement === 'prev' && !noNextButton){
        var prevButtonsSelected = '<button class="customButtonDisabled nextStepButtonDisabled">' + nextButtonsText + '</button>';
        var finalExport = exportedData + prevButtonsSelected;
    }else{
        var finalExport = exportedData;
    }

    if (exportedData && finalExport) {
        return finalExport;
    }
    return false;
}

function error_info_screen(message,screen){
    $('.mainUsageScreen').css('display','none');
    var exportedHtml = '' +
        '                   <div class="ibox" style="box-shadow: 0px 0px 40px -20px black;">' +
        '                       <div class="ibox-content" style="display: flex;border-top-left-radius: 10px;border-top-right-radius: 10px">' +
        '                           <div class="row" style="margin:0px;margin-top: auto;margin-bottom:auto;width: 100%;">' +
        '                               <div class="col-lg-12"  style="text-align: center"><i style="font-size: 50px;margin: 30px;color: darkorange;" class="fa fa-exclamation-triangle" aria-hidden="true"></i></div>'+
        '                               <div class="col-lg-12"  style="text-align: center">'+message+'</div>'+
        '                        </div>' +
        '                    </div>' +
        '                </div>';
    $('#'+screen).html(exportedHtml).parent('div').css('display','block');
    remove_loader();
}

function service_type_selection_screen(){
    add_loader('serviceTypeSelectionScreen');
    var loadService = function(response){
        if($('#serviceTypeSelectionScreen').html().length === 0) {
            $('#removeTitle').html((renderLang() === "el" ? "Κλείστε ραντεβού" : "Book Appointment"));
            $('title').html((renderLang() === "el" ? "Κλείστε ραντεβού" : "Book Appointment")+' | '+formData.businessName);
            if(response.enabled){
                var exportedHtml = '<div class="ibox" style="box-shadow: 0px 0px 40px -20px black;">' +
                    '                       <div class="ibox-content" style="display: flex;border-top-left-radius: 10px;border-top-right-radius: 10px">' +
                    '                           <div class="row" style="margin:0px;margin-top: auto;margin-bottom:auto;width: 100%;">' +
                    '                               <div class="col-lg-12 row serviceType oneTapService"  style="padding: 10px;cursor: pointer;margin-bottom:10px;">'+
                    '                                   <div class="col-lg-2 iconDisplayTypes"><div style="margin: auto">'+ response.data.outcallIcon +'</div></div>'+
                    '                                   <div class="col-lg-10 serviceDisplay" style="margin: auto;">'+
                    '                                       <div class="col-lg-12 serviceTypeText" id="outcall" style="font-size: 1rem;"> '+response.data.outcall+'</div>'+
                    '                                   </div>'+
                    '                               </div>'+
                    '                               <div class="col-lg-12 row serviceType oneTapService"  style="padding: 10px;cursor: pointer;margin-bottom:10px;">'+
                    '                                   <div class="col-lg-2 iconDisplayTypes"><div style="margin: auto"> '+ response.data.incallIcon +' </div></div>'+
                    '                                   <div class="col-lg-10 serviceDisplay" style="margin: auto;">'+
                    '                                       <div class="col-lg-12 serviceTypeText" id="incall" style="font-size: 1rem;"> '+response.data.incall+'</div>'+
                    '                                   </div>'+
                    '                               </div>'+
                    '                        </div>' +
                    '                    </div>' +
                    '                </div>';
                screen_renderer('serviceTypeSelectionScreen',exportedHtml);
                const divElements = document.querySelectorAll('.serviceType.oneTapService');
                update_data_center('availableServiceTypes',response.data);
                divElements.forEach(function(divElement) {
                    divElement.addEventListener('click', function() {
                        if(formData.serviceTypeSelected === '' || formData.serviceTypeSelected !== this.querySelector('.serviceTypeText').id){
                            clean_screens_cache();
                            clean_state_cache('all');
                        }
                        update_data_center('serviceTypeSelected',this.querySelector('.serviceTypeText').id);
                        category_and_services_selection_screen('serviceTypeSelectionScreen');
                    });
                });
                remove_loader();
            }else if(!response.enabled && !response.enabledErrorScreen){
                update_data_center('availableServiceTypes',response.data);
                update_data_center('serviceTypeSelected',response.data.selectedType);
                bookScreenManagement('next','direct','serviceTypeSelectionScreen','categoryAndServicesSelectionScreen');
            }else{
                error_info_screen(response.data.message,'serviceTypeSelectionScreen');
            }
        }else{
            cached_screen_render('serviceTypeSelectionScreen');
            fake_loader_remove();
        }
    };
    if(formData.firstScreen.data){
        loadService(formData.firstScreen);
    }else{
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        var place = urlParams.get('keyl');
        $.ajax({
            type: "POST",
            url: "https://api.datelly.com",
            data: {
                action: "screenInfosGathering",
                keyl: place,
                type: 'serviceTypeSelection',
                lang: renderLang()
            },
            success: function (response) {
                var response = JSON.parse(response);
                loadService(response);
            },
            error: function(xhr, status, error) {
                error_info_screen(xhr.responseText);
            }
        });
    }
}

function barber_selection_screen(prevScreen){
    add_loader('barberSelectionScreen');
    if($('#barberSelectionScreen').html().length === 0 || prevScreen === 'locationTrackScreen') {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        var place = urlParams.get('keyl');
        $.ajax({
            type: "POST",
            url: "https://api.datelly.com",
            data: {
                action: "screenInfosGathering",
                keyl: place,
                type: 'barberSelection',
                lang: renderLang(),
                extraData: {
                    selectedServiceCategoryId: formData['selectedServices'][0]['categoryId'],
                    serviceTypeSelected: formData['serviceTypeSelected'],
                    clientLocationData:{
                        arithmos: formData['locationInfos'].arithmos,
                        latitude: formData['locationInfos'].latitude,
                        longitude: formData['locationInfos'].longitude,
                        odos: formData['locationInfos'].odos,
                        perioxh: formData['locationInfos'].perioxh,
                        polh: formData['locationInfos'].polh,
                        xwra: formData['locationInfos'].xwra,
                    },
                    servicesSelected: formData['selectedServices']
                }
            },
            success: function(response) {
                response = JSON.parse(response);
                if(response.enabled){
                    var barbersHtml = response.data.map(function(barber) {
                        return '<div class="col-lg-12 row serviceType oneTapService selectedBarb" style="padding: 10px;cursor: pointer;margin-bottom:10px;">'+
                            '       <div class="col-lg-3 iconDisplay" style="margin-left: 10px;"><img class="barberIcon" src="'+barber.iconPath + barber.icon+'"></div>'+
                            '       <div class="col-lg-9 serviceDisplay" style="margin: auto;padding: 0px;text-align: center;">'+
                            '           <div class="barberNameText" id="'+barber.id+'"  style="font-size: 1.3rem;"> '+barber.name+'</div>'+
                            '       </div>'+
                            '   </div>';
                    }).join('');
                    var exportedHtml = '<div class="ibox" style="box-shadow: 0px 0px 40px -20px black;">' +
                        '                   <div class="ibox-content" style="display: flex;border-top-left-radius: 10px;border-top-right-radius: 10px">' +
                        '                       <div class="row" style="margin:0px;margin-top: auto;margin-bottom:auto;width: 100%;">' +
                        barbersHtml +
                        '                        </div>' +
                        '                    </div>' +
                        '                </div>';
                  if (!$('.barberSelectionScreen > .prevStepButton').length) {
                     $('.barberSelectionScreen').append(bookScreenManagement('prev','controls', 'barberSelectionScreen',prevScreen));
                   }
                    update_data_center('availableBarbers', response.data);
                    screen_renderer('barberSelectionScreen',exportedHtml);
                    const divElements = document.querySelectorAll('.serviceType.oneTapService.selectedBarb');
                    divElements.forEach(function(divElement) {
                        divElement.addEventListener('click', function() {
                            add_loader();
                            const id = this.querySelector('.barberNameText').id;
                            const filteredData = response.data.filter(item => item.id === id);
                            update_data_center('selectedBarber', filteredData[0]);
                            bookScreenManagement('next','direct','barberSelectionScreen',prevScreen);
                        });
                    });
                    remove_loader();
                }else if(!response.enabled && !response.enabledErrorScreen && response['data'].length > 0){
                    update_data_center('availableBarbers', response.data);
                    update_data_center('selectedBarber',response.data[0]);
                    bookScreenManagement('next','direct','barberSelectionScreen','hourSelectionScreen');
                }else if(response['data'].length === 0 && !response.enabled && !response.enabledErrorScreen){
                    var selectedTitle = renderLang() === "el" ? "Κλείστε ραντεβού στο χώρο σας" : "Book appointment at your place";
                    var selectedText = renderLang() === "el" ? "Η περιοχή στην οποία βρίσκεστε δεν εξυπηρετείται!" : "The area you are in is not served!";
                    var buttonText = renderLang() === "el" ? "Το κατάλαβα!" : "I got it!";
                    swal({
                        title: selectedTitle,
                        text: selectedText,
                        type: "warning",
                        showCancelButton: false,
                        closeOnConfirm: true,
                        confirmButtonColor: "#0c8656",
                        confirmButtonText: buttonText,
                        customClass: "customSwallClass"
                    },function(){
                      bookScreenManagement('prev','direct','locationTrackScreen',false);
                    });
                    remove_loader();
                }else{
                    error_info_screen(response.data.message,'barberSelectionScreen');
                }
            },
            error: function(xhr, status, error) {
                error_info_screen(xhr.responseText);
            }
        });
    }else{
        cached_screen_render('barberSelectionScreen');
        fake_loader_remove();
    }
}

function render_map_box_lib(){
    // Check if the CSS files exist in the DOM
    var existingCss1 = document.querySelector('link[href="css/mapbox/mapbox-gl.css"]');
    var existingCss2 = document.querySelector('link[href="css/mapbox/mapbox-gl-directions.css"]');
    // Check if the JS files exist in the DOM
    var existingJs1 = document.querySelector('script[src="js/mapbox/mapbox-gl.js"]');
    var existingJs2 = document.querySelector('script[src="js/mapbox/mapbox-gl-directions.js"]');
    var existingJs3 = document.querySelector('script[src="js/mapbox/html2canvas.min.js"]');  // Check if html2canvas.min.js exists in the DOM
    // Check if any of the files are missing
    if (!existingCss1 || !existingCss2 || !existingJs1 || !existingJs2 || !existingJs3) {
        // Create and append CSS files
        var css1 = document.createElement('link');
        css1.href = 'css/mapbox/mapbox-gl.css';
        css1.rel = 'stylesheet';
        document.head.appendChild(css1);
        var css2 = document.createElement('link');
        css2.href = 'css/mapbox/mapbox-gl-directions.css';
        css2.rel = 'stylesheet';
        document.head.appendChild(css2);
        // Create and append JS files
        var js1 = document.createElement('script');
        js1.src = 'js/mapbox/mapbox-gl.js';
        document.body.appendChild(js1); // it's generally best to append scripts at the end of the body
        js1.onload = function() {  // to ensure the first script is loaded before the second one
            var js2 = document.createElement('script');
            js2.src = 'js/mapbox/mapbox-gl-directions.js';
            document.body.appendChild(js2);
            js2.onload = function() {
                var js3 = document.createElement('script');
                js3.src = 'js/mapbox/html2canvas.min.js';  // add html2canvas.min.js
                document.body.appendChild(js3);
            }
        };
    }
}

function location_track_screen(prevScreen){
    add_loader('locationTrackScreen');
    if($('#locationTrackScreen').html().length === 0) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        var place = urlParams.get('keyl');
        $.ajax({
            type: "POST",
            url: "https://api.datelly.com",
            data: {
                action: "screenInfosGathering",
                keyl: place,
                type: 'locationTrack',
                lang: renderLang()
            },
            success: function(response) {
                response = JSON.parse(response);
                if(response.enabled){
                   render_map_box_lib();
                    setTimeout(function(){
                        navigator.geolocation.getCurrentPosition(function(position) {
                            // Success callback function
                            successLocation(position, prevScreen);
                        }, errorLocation, { enableHighAccuracy: true });
                    },1000);
                }else{
                    error_info_screen(response.data.message,'categoryAndServicesSelectionScreen');
                }
            },
            error: function(xhr, status, error) {
                error_info_screen(xhr.responseText);
            }
        });
    }else{
        cached_screen_render('locationTrackScreen');
        fake_loader_remove();
    }
}

function category_and_services_selection_screen(prevScreen) {
    add_loader('categoryAndServicesSelectionScreen');
    if($('#categoryAndServicesSelectionScreen').html().length === 0){
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        var place = urlParams.get('keyl');
        $.ajax({
            type: "POST",
            url: "https://api.datelly.com",
            data: {
                action: "screenInfosGathering",
                keyl: place,
                type: 'categoryAndServicesSelection',
                lang: renderLang(),
                extraData: {
                    serviceTypeSelected: formData['serviceTypeSelected']
                }
            },
            success: function (response) {
                response = JSON.parse(response);
                if (response.enabled) {
                    var tabButtonsHtml = '';
                    var tabsHtml = '';
                    const staticContainers = document.getElementsByClassName('gray-bg');
                    const numCategories = response.data.categoriesData.length;
                    const elementWidth = staticContainers[0].offsetWidth - 50; // Assuming you want to get the width from the first element
                    if ($(window).width() > 769) {
                        var categoryWidth = 0;
                    }else{
                        var categoryWidth = (elementWidth / numCategories);
                    }
                    var isActive = '';
                    for (var i = 0; i < numCategories; i++) {
                        var servicesHtml = '';
                        if (i === 0) {
                            isActive = 'active';
                        }
                        var selectedTitle = renderLang() === "el" ? "Επιλέξτε τις υπηρεσίες που θέλετε" : "Select the services you want";
                        if(response.data.categoriesTab.enabled) {
                            tabButtonsHtml += '<li style="width:' + categoryWidth + 'px;overflow: hidden;text-align: center;min-width: fit-content;"><a class="nav-link ' + isActive + '" data-toggle="tab" href="#categoryTab-' + i + '" onclick="clean_service_selection();">' + response.data.categoriesData[i].icon + ' ' + response.data.categoriesData[i].name + '</a></li>';
                            var selectedTitle = renderLang() === "el" ? "Επιλέξτε μια κατηγορία και τις υπηρεσίες που θέλετε" : "Pick a category and services you want"
                        }
                        servicesHtml += '<div class="row" style="margin:0px;margin-top: auto;margin-bottom:auto;width: 100%;">';
                        for (var j = 0; j < response.data.categoriesData[i].services.length; j++) {
                            servicesHtml += '<div class="col-lg-12 row serviceType" onclick="activateHover(' + response.data.categoriesData[i].services[j].id + ',\'' + response.data.categoriesData[i].services[j].name + '\','+response.data.categoriesData[i].id+')" style="padding: 10px;cursor: pointer;margin-bottom:10px;" id="hover-' + response.data.categoriesData[i].services[j].id + '">' +
                                '            <div class="col-lg-1 checkboxDisplay" style="margin-top: auto;margin-bottom: auto;">' +
                                '                <label style="font-size: 1.2rem;">' +
                                '                    <input type="checkbox" class="custom-checkbox serviceSelector" id="' + response.data.categoriesData[i].services[j].name + '" style="transition: all 0.2s ease-in-out 0s; font-size: 1.2rem;">' +
                                '                    <span class="checkmark" style="cursor: pointer"></span>' +
                                '                </label>' +
                                '            </div>' +
                                '            <div class="col-lg-1 iconDisplay">' +
                                '                <img src="' + response.data.categoriesData[i].services[j].icon + '" style="width:60px;height:60px;border-radius: 100%;">' +
                                '            </div>' +
                                '            <div class="col-lg-10 serviceDisplay"> ' +
                                '               <div class="col-lg-12 serviceNameText" style="font-size: 20px;"> ' + response.data.categoriesData[i].services[j].name + '</div>' +
                                '                <div class="col-lg-12">' +
                                response.data.categoriesData[i].services[j].description +
                                '                </div>' +
                                '            </div>' +
                                '        </div>';
                        }
                        servicesHtml += '</div>';
                        tabsHtml += '<div class="tab-pane tab-' + [i] + '-content ' + isActive + '" id="categoryTab-' + i + '">' + servicesHtml + '</div>';
                        isActive = '';
                    }
                    var exportedHtml = '     <div class="ibox" style="box-shadow: 0px 0px 40px -20px black;">' +
                        '                       <div class="tabs-container">' +
                        '                           <div class="ibox-title" style="border-bottom: 1px solid #424242!important;">' +
                        '                               <h5>'+selectedTitle+'</h5>' +
                        '                           </div>' +
                        '                           <ul class="nav nav-tabs">' + tabButtonsHtml + '</ul>' +
                        '                           <div class="ibox-content tab-content" style="display: flex;padding: 0px;padding-top: 20px;">' + tabsHtml +'</div>' +
                        '                       </div>' +
                        '                   </div>';
                    if (!$('.categoryAndServicesSelectionScreen > .prevStepButton').length) {
                        $('.categoryAndServicesSelectionScreen').append(bookScreenManagement('prev','controls', 'categoryAndServicesSelectionScreen', prevScreen));
                    }
                    screen_renderer('categoryAndServicesSelectionScreen',exportedHtml);
                    var toImportServices = [];
                    for (let i = 0; i < response.data.categoriesData.length; i++) {
                        for (let j = 0; j < response.data.categoriesData[i].services.length; j++) {
                            toImportServices.push(response.data.categoriesData[i].services[j]);
                        }
                    }
                    update_data_center('availableServices',toImportServices);
                    remove_loader();
                }else if(!response.enabled && !response.enabledErrorScreen){
                    response.data.categoriesData[0].services[0].categoryId = response.data.categoriesData[0].id;
                    update_data_center('selectedServices',response.data.categoriesData[0].services);
                    update_data_center('availableServices',response.data.categoriesData[0].services);
                    bookScreenManagement('next','direct','categoryAndServicesSelectionScreen',prevScreen);
                }else{
                    error_info_screen(response.data.message,'categoryAndServicesSelectionScreen');
                }
            },
            error: function (xhr, status, error) {
                error_info_screen(xhr.responseText);
            }
        });
    }else{
        cached_screen_render('categoryAndServicesSelectionScreen');
        fake_loader_remove();
    }
}

function hour_selection_screen(prevScreen) {
    add_loader('hourSelectionScreen');
    $('#freeAppointments').html('');
    if (typeof formData['locationInfos']['latitude'] !== "undefined") {
        var locationInfos = {
            clientLocationData: {
                arithmos: formData['locationInfos'].arithmos,
                latitude: formData['locationInfos'].latitude,
                longitude: formData['locationInfos'].longitude,
                odos: formData['locationInfos'].odos,
                perioxh: formData['locationInfos'].perioxh,
                polh: formData['locationInfos'].polh,
                xwra: formData['locationInfos'].xwra,
                servicesSelected: formData['selectedServices']
            }
        };
    } else {
        var locationInfos = false;
    }
    if (typeof formData['selectedBarber']['id'] !== "undefined") {
        var selectedBarber = {
            selectedBarberData: {
                id: formData['selectedBarber'].id,
                name: formData['selectedBarber'].name,
            }
        };
    } else {
        var selectedBarber = false;
    }
    var selectedServices = formData['selectedServices'];
    $.ajax({
        url: "https://api.datelly.com",
        type: "POST",
        data: {
            action: "getPriceAndTimeForServices",
            location: locationInfos,
            services: selectedServices,
            barber: selectedBarber
        },
        dataType: "json",
        success: function (data) {
            if (data) {
                let selectedServicesString = formData['selectedServices'].map(service => service.name).join(', ');
                update_data_center('haircutInfos', data);
                if (!data.extraData) {
                    var extraPricing = '<div class="col-lg-12" id="previewContDateTime"></div><div class="col-lg-6 " style="width:50%;padding: 10px;display: flex;">' +
                        '                     <span class="timePreviewCont" style="margin-left: 0px;margin-right: auto;"> ≈ ' + formatTime(data.sumTime, renderLang()) + '⌛</span>' +
                        '                 </div>' +
                        '                 <div class="col-lg-6" style="text-align: right;width:50%;padding: 10px;display: flex;">' +
                        '                     <span class="pricePreviewCont"> ' + data.sumPrice + ' €</span>' +
                        '                 </div>';
                } else {
                    var extraPricing = '<div class="col-lg-12" id="previewContDateTime"></div><div class="col-lg-6" style="display:flex;width:50%;text-align: start;padding: 0px 0px 0px 10px;margin-bottom: 10px;margin-top: 5px;"><div style="margin: auto;margin-left: 0px;">' +
                        '                     <div class="timePreviewCont" style="width: 100%margin-left: 0px; margin-right: auto;"> ≈ ' + formatTime(data.extraData.servicesTime, renderLang()) + '⌛</div>' +
                        '                     <div style="width: 100%;font-size: 10px;">' + (renderLang() === "el" ? "Extra διάρκεια μεταφοράς" : "Extra duration of transfer") + ' <br><span style="color:#03a76f;margin-right: 10px;">(' + data.extraData.distance + ' ' + (renderLang() === "el" ? "Χλμ μαρκιά" : "Km away") + ')</span><i class="fa fa-clock-o" aria-hidden="true"></i>' + ' ' + data.extraData.singleDistanceTime + '"</div>' +
                        '                 </div>' +
                        '                 </div>' +
                        '                 <div class="col-lg-6" style="width:50%;text-align: right;padding: 0px 10px 0px 0px;margin-bottom: 10px;margin-top: 5px;">' +
                        '                     <div class="pricePreviewCont"> ' + data.sumPrice + ' €</div>' +
                        '                     <div style="width: 100%;font-size: 10px;">' + (renderLang() === "el" ? "Κόστος υπηρεσιών" : "Services Cost") + ' ' + data.extraData.servicesPrice + '€</div>' +
                        '                     <div style="width: 100%;font-size: 10px;">' + (renderLang() === "el" ? "Κόστος μεταφοράς" : "Transportation Cost") + '  ' + data.extraData.distancePrice + '€</div>' +
                        '                 </div>';
                }
                var exportedHtml = '<div class="ibox" style="box-shadow: 0px 0px 40px -20px black;">' +
                    '                    <div class="ibox-content" style="border-top-left-radius: 10px;border-top-right-radius: 10px;">' +
                    '                       <div class="row previewBox" style="margin: 0px;background-color: #242424;border-radius: 10px;">' +
                    '                           <div class="col-lg-12 customServicesPreviewScreen" style="background-image: url(' + formData['selectedBarber']['iconPath'] + formData['selectedBarber']['icon'] + ');">' +
                    '                                       <div style="background-color: rgb(36 36 36 / 70%);border-top-right-radius: 10px;">' + (renderLang() === "el" ? "Επιλεγμένες υπηρεσίες" : "Selected Services") + '</div>' +
                    '                                       <div style="background-color: rgb(36 36 36 / 70%);border-bottom-right-radius: 10px;">' + selectedServicesString + '&nbsp; ' + (renderLang() === "el" ? "με" : "with") + ' <span style="color: #0dda92">' + formData['selectedBarber']['name'] + '</span></div>' +
                    '</div>' + extraPricing +
                    '</div>' +
                    '                         <div class="row" style="margin-top:15px;margin-left: 0px;margin-right: 0px;">' +
                    '                            <div class="col-lg-6" style="background-color: #242424;padding-top: 10px;padding-bottom: 10px;border-radius: 10px;">' +
                    '                                <div id="calendar"></div>' +
                    '                            </div>' +
                    '                            <div id="calendar-toolbar" style="display: none;"></div>' +
                    '                            <div class="apointmentTimeInfo"><span>' + (renderLang() === "el" ? "Επιλέξτε Διαθέσιμη ώρα" : "Choose Available time") + '</span></div>' +
                    '                            <div class="col-lg-5 freeAppointmentCont">' +
                    '                                <div id="freeAppointments"></div>' +
                    '                            </div>' +
                    '                        </div>' +
                    '                    </div>' +
                    '               </div>';

                screen_renderer('hourSelectionScreen', exportedHtml);
                if (!$('.hourSelectionScreen > .prevStepButton').length) {
                    $('.hourSelectionScreen').append(bookScreenManagement('prev', 'controls', 'hourSelectionScreen', prevScreen));
                }
                $('.hourSelectionScreen > .nextStepButton').remove();
                if (!$('.hourSelectionScreen > .nextStepButtonDisabled').length) {
                    $('.hourSelectionScreen').append('<button class="customButtonDisabled nextStepButtonDisabled">' + (renderLang() === "el" ? "Επόμενο βήμα" : "Next Step") + '</button>');
                }
                // Perform an action when FullCalendar is rendered
                let workSpec = [];
                // Loop through each item in the response data
                for (let i = 0; i < formData.businessHours.length; i++) {
                    const item = formData.businessHours[i];
                    if (formData.businessHours[i].active === '1') {
                        // Adjust dayOfWeek for FullCalendar
                        let dayOfWeek = parseInt(item.id);
                        dayOfWeek = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert Sunday from 7 to 0
                        // Push a new object into the workSpec array
                        workSpec.push({
                            daysOfWeek: [dayOfWeek], // Array with single element because each item represents a single day
                            startTime: item.startTime,
                            endTime: item.endTime
                        });
                    }
                }
                for (let i = 0; i < formData.sosHours.length; i++) {
                    const item = formData.sosHours[i];
                    if (formData.sosHours[i].active === '1') {
                        // Adjust dayOfWeek for FullCalendar
                        let dayOfWeek = parseInt(item.id);
                        dayOfWeek = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert Sunday from 7 to 0
                        // Push a new object into the workSpec array
                        workSpec.push({
                            daysOfWeek: [dayOfWeek], // Array with single element because each item represents a single day
                            startTime: item.startTime,
                            endTime: item.endTime
                        });
                    }
                }
                const workMin = workSpec.map(item => item.startTime).sort().shift();
                const workMax = workSpec.map(item => item.endTime).sort().pop();
                const workDays = [...new Set(workSpec.flatMap(item => item.daysOfWeek))];
                const hideDays = [...Array(7).keys()].filter(day => !workDays.includes(day));
                var Calendar = FullCalendar.Calendar;
                var calendarEl = document.getElementById('calendar');
                var today = new Date();
                var reconstructedDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                var calendar = new Calendar(calendarEl, {
                    schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
                    nowIndicator: true,
                    locale: renderLang(),
                    headerToolbar: {
                        right: 'next',
                        center: 'title',
                        left: 'prev'
                    },
                    businessHours: workSpec,
                    slotMinTime: workMin,
                    slotMaxTime: workMax,
                    hiddenDays: hideDays,
                    editable: false,
                    droppable: false,
                    aspectRatio: 0.7,
                    validRange: {
                        start: today
                    },
                    dateClick: function (info) {
                        if (window.innerWidth < 768) {
                            $('html, body').animate({
                                scrollTop: $(".freeAppointmentCont").offset().top
                            }, 500);
                        }
                        $(".fc-day-today").removeClass("fc-day-today");
                        $(info.dayEl).addClass("fc-day-today");
                        print_available_appointments(info.dateStr);
                        $('#datePreviewStamp').html(info.dateStr);
                        $('.hourSelectionScreen > .nextStepButton').remove();
                        clean_state_cache('selectedAppointment');
                    }
                });
                calendar.render();
                print_available_appointments(reconstructedDate);
                $('#datePreviewStamp').html(reconstructedDate);
                remove_loader();
            } else {
                swal({
                    title: renderLang() === "el" ? "Ουπς! Κάτι πήγε στραβά" : "Oops! Something went wrong",
                    text: renderLang() === "el" ? "Εμφανίστηκε ένα σφάλμα. Παρακαλούμε δοκιμάστε ξανά και αν το πρόβλημα επιμένει, επικοινωνήστε με το διαχειριστή του συστήματος." : "There was an error that occurred. Please try again and if the issue insists please contact with system administrator.",
                    type: "error",
                    showCancelButton: false,
                    showConfirmButton: true,
                    showConfirmButtonText: 'Ok',
                    customClass: "customSwallClass"
                }, function () {
                    window.location.reload();
                });
            }
        }
    });
}

function book_screen(prevScreen) {
    add_loader('bookScreen');
    if ($('#bookScreen').html().length === 0) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        var place = urlParams.get('keyl');
        $.ajax({
            type: "POST",
            url: "https://api.datelly.com",
            data: {
                action: "screenInfosGathering",
                keyl: place,
                type: 'bookScreen',
                lang: renderLang()
            },
            success: function (response) {
                response = JSON.parse(response);
                if (response.inputFields) {
                    var previewbox = $('.previewBox').html();
                    var exportedHtml = '<div class="ibox" style="box-shadow: 0px 0px 40px -20px black;">' +
                        '                       <div class="ibox-content" style="display: flex;border-top-left-radius: 10px;border-top-right-radius: 10px">' +
                        '                           <div class="row previewBoxFinal" style="margin: 0px;background-color: #242424;border-radius: 10px;">' +
                        previewbox +
                        '                        </div>' +
                        '                    </div>' +
                        '                </div>';
                    exportedHtml += '<div class="ibox" id="secScren" style="box-shadow: 0px 0px 40px -20px black;">' +
                        '                    <div class="ibox-title" style="border-bottom: 1px solid #424242!important;">' +
                        '                        <h5>' + (renderLang() === "el" ? "Οι πληροφορίες σας" : "Your Information") + '</h5>' +
                        '                    </div>' +
                        '                    <div class="ibox-content" style="min-height: 0px;">';
                    exportedHtml += '<form class="row" id="guestInfosForm" style="margin-bottom: 30px;display: none;">';
                    if (response.inputFields.name) {
                        if(response.inputFields.name.required === 1 || response.inputFields.surname.required === 1){
                            var requiredText = renderLang() === "el" ? "(Υποχρεοτικό πεδίο)" : "(Required Field)";
                            var isRequired = true;
                        }else{
                            var requiredText = renderLang() === "el" ? "(Προαιρετικό πεδίο)" : "(Optional Field)";
                            var isRequired = false;
                        }
                        exportedHtml += '               <div class="col-lg-12 col-sm-6" style="padding-left: 10px;padding-right: 10px;">' +
                            '                                <div class="form-group" style="margin-bottom: 0px">' +
                            '                                    <label for="name" class="checkoutLabel"><span style="font-size: 12px!important;">' + response.inputFields.name.fieldName + ' & ' + response.inputFields.surname.fieldName + '</span></label>' +
                            '                                    <input type="text" oninput="inputValidation(this,\'name\')" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" data-isrequired="'+ isRequired +'" class="form-control toFillInput" id="name" placeholder="'+ requiredText +'"  style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
                            '                                </div>' +
                            '                            </div>';
                    }
                    if (response.inputFields.email) {
                        if(response.inputFields.email.required ===1){
                            var requiredText = renderLang() === "el" ? "(Υποχρεοτικό πεδίο)" : "(Required Field)";
                            var isRequired = true;
                        }else{
                            var requiredText = renderLang() === "el" ? "(Προαιρετικό πεδίο)" : "(Optional Field)";
                            var isRequired = false;
                        }
                        exportedHtml += '               <div class="col-lg-12 col-sm-12" style="padding-left: 10px;padding-right: 10px;">' +
                            '                                <div class="form-group" style="margin-bottom: 0px">' +
                            '                                    <label for="email" class="checkoutLabel"><span style="font-size: 12px!important;">' + response.inputFields.email.fieldName + '</span></label>' +
                            '                                    <input type="text" oninput="inputValidation(this)" data-regex="^[\\w.-]+@[\\w.-]+\\.\\w+$" data-isrequired="'+ isRequired +'" class="form-control toFillInput" id="email" placeholder="'+ requiredText +'"  style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
                            '                                </div>' +
                            '                            </div>';
                    }
                    if (response.inputFields.phone) {
                        if(response.inputFields.phone.required ===1){
                            var requiredText = renderLang() === "el" ? "(Υποχρεοτικό πεδίο)" : "(Required Field)";
                            var isRequired = true;
                        }else{
                            var requiredText = renderLang() === "el" ? "(Προαιρετικό πεδίο)" : "(Optional Field)";
                            var isRequired = false;
                        }
                        exportedHtml += '               <div class="col-lg-12 col-sm-12" style="padding-left: 10px;padding-right: 10px;margin-top: 10px;">' +
                            '                                <div class="form-group" style="margin-bottom: 0px">' +
                            '                                    <label for="phone" class="checkoutLabel" style="position: absolute;bottom: 35px;height: 17px;z-index: 1;"><span style="font-size: 12px!important;">' + response.inputFields.phone.fieldName + '</span></label>' +
                            '                                    <input type="text" oninput="inputValidation(this,\'phone\')" data-regex="^\\d{10}$" class="form-control toFillInput" data-isrequired="'+ isRequired +'" id="phone" placeholder="'+ requiredText +'"  style="border: 1px solid rgb(12, 134, 86) !important;padding-top: 7px;padding-bottom: 7px;">' +
                            '                                </div>' +
                            '                            </div>';
                    }
                    if (response.inputFields.city) {
                        if(response.inputFields.city.required ===1){
                            var requiredText = renderLang() === "el" ? "(Υποχρεοτικό πεδίο)" : "(Required Field)";
                            var isRequired = true;
                        }else{
                            var requiredText = renderLang() === "el" ? "(Προαιρετικό πεδίο)" : "(Optional Field)";
                            var isRequired = false;
                        }
                        exportedHtml += '               <div class="col-lg-12 col-sm-12" style="padding-left: 10px;padding-right: 10px;">' +
                            '                                <div class="form-group" style="margin-bottom: 0px">' +
                            '                                    <label for="city" class="checkoutLabel"><span style="font-size: 12px!important;">' + response.inputFields.city.fieldName + '</span></label>' +
                            '                                    <input type="text" oninput="inputValidation(this,\'city\')" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" class="form-control toFillInput" data-isrequired="'+ isRequired +'" id="city" placeholder="'+ requiredText +'"  style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
                            '                                </div>' +
                            '                            </div>';
                    }
                    if (response.inputFields.address) {
                        if(response.inputFields.address.required ===1){
                            var requiredText = renderLang() === "el" ? "(Υποχρεοτικό πεδίο)" : "(Required Field)";
                            var isRequired = true;
                        }else{
                            var requiredText = renderLang() === "el" ? "(Προαιρετικό πεδίο)" : "(Optional Field)";
                            var isRequired = false;
                        }
                        exportedHtml += '               <div class="col-lg-12 col-sm-12" style="padding-left: 10px;padding-right: 10px;">' +
                            '                                <div class="form-group" style="margin-bottom: 0px">' +
                            '                                    <label for="address" class="checkoutLabel"><span style="font-size: 12px!important;">' + response.inputFields.address.fieldName + '</span></label>' +
                            '                                    <input type="text" oninput="inputValidation(this,\'address\')" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" class="form-control toFillInput"  data-isrequired="'+ isRequired +'" id="address" placeholder="'+ requiredText +'"  style="border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;">' +
                            '                                </div>' +
                            '                            </div>';
                    }
                    if (response.inputFields.note) {
                        if(response.inputFields.note.required ===1){
                            var requiredText = renderLang() === "el" ? "(Υποχρεοτικό πεδίο)" : "(Required Field)";
                            var isRequired = true;
                        }else{
                            var requiredText = renderLang() === "el" ? "(Προαιρετικό πεδίο)" : "(Optional Field)";
                            var isRequired = false;
                        }
                        exportedHtml += '               <div class="col-lg-12 col-sm-12" style="padding-left: 10px;padding-right: 10px;">' +
                            '                                <div class="form-group" style="margin-bottom: 0px">' +
                            '                                    <label for="note" class="checkoutLabel"><span style="font-size: 12px!important;">' + response.inputFields.note.fieldName + '</span></label>' +
                            '                                    <textarea data-isrequired="'+ isRequired +'" oninput="inputValidation(this,\'note\')" data-regex=".*[a-zA-Z0-9Α-Ωα-ω\\s,].*" class="form-control toFillInput" id="note" placeholder="'+ requiredText +'"  style="    height: 130px;border: 1px solid rgb(12, 134, 86) !important;margin-top: -9px;border-radius: 5px;"></textarea>' +
                            '                                </div>' +
                            '                            </div>';
                    }
                    var selectedMessage = renderLang() === "el" ? "Όταν κάνετε κράτηση με τον/την "+ formData['selectedBarber']['name'] +", ενδέχεται να λάβετε επικοινωνία σχετικά με το ραντεβού από το Barbreon. Αυτό περιλαμβάνει επιβεβαιώσεις κράτησης και ακύρωσης και υπενθυμίσεις ραντεβού μέσω email ή SMS." : "When booking with "+ formData['selectedBarber']['name'] +", you may receive appointment-specific communication from Barbreon. This includes booking and cancelation confirmations, and appointment reminders via email or SMS.";
                    exportedHtml += '<div id="toast-container" class="toast-top-right col-lg-12" aria-live="polite" role="alert" style="z-index: 0;position: relative; top: 0px;left: 0px;margin-top: 30px;margin-bottom: 30px;">' +
                                        '<div class="toast toast-info toastrCustom">' +
                                            '<div class="toast-message">'+ selectedMessage +'</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</form>';
                    if(response.checkoutOptions.userCheckout === '1'){
                       /* // Check if the CSS files exist in the DOM
                        // Check if the JS files exist in the DOM
                        var existingJs1 = document.querySelector('script[src="js/platform.js"]');
                        // Check if any of the files are missing
                        if (!existingJs1) {
                            // Create and append CSS files
                            var js1 = document.createElement('script');
                            js1.src = 'js/platform.js';
                            document.body.appendChild(js1); // it's generally best to append scripts at the end of the body
                            js1.onload = function () {  // to ensure the first script is loaded before the second one
                                gapi.load('auth2', function() {
                                    gapi.auth2.init({
                                        client_id: '962386799575-8ko16b7o8cnjmoblpeshsoc7dsr9jnvo.apps.googleusercontent.com',
                                        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
                                    });
                                });
                                document.getElementById('google-signin').onclick = function() {
                                    console.log('Google Signin button clicked'); // Add this line

                                    gapi.auth2.getAuthInstance().signIn().then(
                                        function(user) {
                                            // user is now signed in
                                            // get user info
                                            var profile = user.getBasicProfile();
                                            console.log('Name: ' + profile.getName());
                                            console.log('Email: ' + profile.getEmail());

                                            // get id_token
                                            var id_token = user.getAuthResponse().id_token;
                                            console.log('ID Token: ' + id_token);
                                        },
                                        function(error) {
                                            console.error('Sign-in error', error);
                                        }
                                    );
                                };
                            };
                        }*/
                    }
                    if(response.checkoutOptions.guestCheckout === '1' && response.checkoutOptions.userCheckout === '1'){
                        $('#guestInfosForm').css('display','none');
                        exportedHtml += '<div class="col-lg-12" id="socialForm" style="background-color: #242424;border-radius: 10px;padding: 20px;text-align: center;">' +
                            '                <h2>Continue With Social</h2>' +
                                            '<div class="login-box">' +
                                                '<a href="#" class="social-button" id="google-signin"> <span>Continue with Google</span></a>' +
                                            '</div>' +
                            '               <h2>OR</h2>' +
                            '               <button class="customButton" id="forceGuest" style="height: 40px;border-radius: 10px;margin-left: auto;margin-right: auto;width: 100%;margin-bottom: 10px;">Continue as guest</button>' +
                                         '</div>';
                    }
                    if(response.checkoutOptions.guestCheckout === '0' && response.checkoutOptions.userCheckout === '1'){
                        //login only as user
                        exportedHtml += '<div class="col-lg-12" id="socialForm" style="background-color: #242424;border-radius: 10px;padding: 20px;text-align: center;">' +
                            '                <h2>Continue With Social</h2>' +
                            '<div class="login-box">' +
                            '<a href="#" class="social-button" id="facebook-connect"> <span>Continue with Facebook</span></a>' +
                            '<a href="#" class="social-button" id="google-signin"> <span>Continue with Google</span></a>' +
                            '<a href="#" class="social-button" id="twitter-connect"> <span>Continue with Twitter</span></a>' +
                            '</div>' +
                            '</div>';
                    }
                    exportedHtml += '</div>' +
                        '        </div>';
                    screen_renderer('bookScreen', exportedHtml);
                    if (!$('.bookScreen > .prevStepButton').length) {
                        $('.bookScreen').append(bookScreenManagement('prev', 'controls', 'bookScreen', prevScreen));
                    }
                    if(response.checkoutOptions.guestCheckout === '1' && response.checkoutOptions.userCheckout === '0'){
                        $('#guestInfosForm').css('display','block');
                    }
                    if(response.checkoutOptions.guestCheckout === '1' && response.checkoutOptions.userCheckout === '1') {
                        $('html, body').scrollTop(0);
                        document.getElementById("forceGuest").addEventListener("click", function () {
                            $('#socialForm').css('opacity', '0');
                            setTimeout(function () {
                                $('#socialForm').css('display', 'none');
                                $('#guestInfosForm').css('display', 'block');
                            }, 300);
                        });
                    }
                    if (response.inputFields.phone) {
                        // Check if the CSS files exist in the DOM
                        var existingCss1 = document.querySelector('link[href="css/location/intlTilInput.css"]');
                        // Check if the JS files exist in the DOM
                        var existingJs1 = document.querySelector('script[src="js/location/intlTelInput.min.js"]');
                        // Check if any of the files are missing
                        if (!existingCss1 || !existingJs1) {
                            // Create and append CSS files
                            var css1 = document.createElement('link');
                            css1.href = 'css/location/intlTilInput.css';
                            css1.rel = 'stylesheet';
                            document.head.appendChild(css1);
                            // Create and append JS files
                            var js1 = document.createElement('script');
                            js1.src = 'js/location/intlTelInput.min.js';
                            document.body.appendChild(js1); // it's generally best to append scripts at the end of the body
                            js1.onload = function () {  // to ensure the first script is loaded before the second one
                                var input = document.querySelector("#phone");
                                window.intlTelInput(input, {
                                    allowDropdown: true,
                                    autoHideDialCode: false,
                                    autoPlaceholder: "on",
                                    dropdownContainer: document.getElementById('countryCode'),
                                    excludeCountries: ["us"],
                                    formatOnDisplay: false,
                                    geoIpLookup: function (success, failure) {
                                        $.get("https://ipinfo.io", function () {
                                        }, "jsonp").always(function (resp) {
                                            var countryCode = (resp && resp.country) ? resp.country : "";
                                            success(countryCode);
                                        });
                                    },
                                    initialCountry: "auto",
                                    separateDialCode: true,
                                    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.13/js/utils.js",
                                });
                            };
                        }
                    }
                    validateAllInputs();
                    remove_loader();
                } else {
                    swal({
                        title: renderLang() === "el" ? "Ουπς! Κάτι πήγε στραβά" : "Oops! Something went wrong",
                        text: renderLang() === "el" ? "Εμφανίστηκε ένα σφάλμα. Παρακαλούμε δοκιμάστε ξανά και αν το πρόβλημα επιμένει, επικοινωνήστε με το διαχειριστή του συστήματος." : "There was an error that occurred. Please try again and if the issue insists please contact with system administrator.",
                        type: "error",
                        showCancelButton: false,
                        showConfirmButton: true,
                        showConfirmButtonText: 'Ok',
                        customClass: "customSwallClass"
                    }, function () {
                        window.location.reload();
                    });
                }
            },
            error: function (xhr, status, error) {
                swal({
                    title: renderLang() === "el" ? "Ουπς! Κάτι πήγε στραβά" : "Oops! Something went wrong",
                    text: renderLang() === "el" ? "Εμφανίστηκε ένα σφάλμα. Παρακαλούμε δοκιμάστε ξανά και αν το πρόβλημα επιμένει, επικοινωνήστε με το διαχειριστή του συστήματος." : "There was an error that occurred. Please try again and if the issue insists please contact with system administrator.",
                    type: "error",
                    showCancelButton: false,
                    showConfirmButton: true,
                    showConfirmButtonText: 'Ok',
                    customClass: "customSwallClass"
                }, function () {
                    window.location.reload();
                });
            }
        });
    } else {
        var inputElement = $('#name');
        if (inputElement.val() !== '') {
            validateAllInputs();
        }
        $('.previewBoxFinal').html($('.previewBox').html());
        if($('#socialForm').length){
            $('#socialForm').css('opacity','1').css('display','block');
            $('#guestInfosForm').css('display','none');
        }
        cached_screen_render('bookScreen');
        fake_loader_remove();
    }
}
/**
 * book Screens end
 * */

/**
 * App screens render start
 */
function appScreensManagement(screen,type){
    var timeout = 0;
    if(type === 'firstRender'){
        update_data();
        timeout = 500;
    }
    setTimeout(function () {
        var exportedHtml = '';
        var found = false;
        if(screen === 'qrcode'){
            $('#removeTitle').html((renderLang() === "el" ? "Σάρωση κώδικα QR" : "Scan QR Code"));
            $('title').html((renderLang() === "el" ? "Σάρωση κώδικα QR" : "Scan QR Code")+' | '+formData.businessName);
            exportedHtml += '<div class="row" style="margin: auto;">' +
                '        <div class="col-lg-12" style="text-align:center;">' +
                '            <div id="qrcodeImage" style=" width: 250px; height: 250px;margin:auto;"></div>' +
                '        </div>' +
                '    </div>';
            found = true;
        }
        if(screen === 'infos'){
            $('#removeTitle').html((renderLang() === "el" ? "Πληροφορίες" : "infos"));
            $('title').html((renderLang() === "el" ? "Πληροφορίες" : "infos"));
            var screenWidth = window.innerWidth;
            var businessHours = ' <form id="businessHoursPreview">';
            var businessHoursResponse = formData['businessHours'];
            if(renderLang() === 'el'){
                var dayNames = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
            }else{
                var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            }
            let dayOfWeek = new Date().getDay();
            $.each(businessHoursResponse, function(index, hour) {
                let addClass = '';
                if (hour.name === dayNames[dayOfWeek]) {
                    addClass = 'businessHoursToday';
                }
                businessHours += `
                                    <div class="form-group ${addClass}" style="display: flex; justify-content: space-between;margin-bottom: 0px;">
                                        <label style="margin: auto;margin-right: 20px;" for="${hour.name}">${hour.name}</label>
                                        <div class="form-control" id="${hour.name}" style="text-align: end;background-color: #ff000000!important;border: 0px!important;">`;
                                            if (hour.active === '0') {
                                                businessHours += '<i>'+(renderLang() === "el" ? "Κλειστά" : "Closed")+'</i>';
                                            } else {
                                                businessHours += `${hour.startTime} - ${hour.endTime}`;
                                            }
                                            businessHours += `
                                        </div>
                                    </div>
                                `;
            });
            if(formData.businessPhone !== ''){
                var exportedPhoneInfo =      '     ' +
                                            '<div class="row" style="margin-bottom: 20px;margin-left: 0px;margin-right: 0px;">' +
                                            '   <div style="width:50%;display: flex;font-size: 15px;">' +
                                            '       <div style="margin-top:auto;margin-bottom:auto;margin-right: 10px;">' +
                    '                                    <i class="fa customFA fa-mobile" aria-hidden="true"  style="font-size: 30px;color:var(--extra-color)"></i>' +
                    '                                </div>' +
                    '                               <div style="font-size: 15px;margin-top:auto;margin-bottom:auto;">' +
                    '                                       '+ formData.businessPhone +
                    '                                 </div>' +
                    '                           </div>' +
                    '                               <div style="width:50%;margin: auto;text-align: end;">' +
                    '                                  <a href="tel:'+formData.businessPhone+'" class="btn btn-lg customButton" style="margin-right: 10px;">'+ (renderLang() === "el" ? "Κλήση" : "Call") +'</a>' +
                    '                               </div>' +
                    '                       </div>';
            }else{
                var exportedPhoneInfo = '';
            }
            businessHours += ' </form>';


            if(formData.portfolio){
                var portfolioImages = '';
                for (var i = 0; i < formData.portfolio.length ; i++) {
                    portfolioImages += '<div class="item"><img src="images/barbers/'+formData.portfolio[i].image+'"></div>';
                }
                var carousel = '<div class="owl-carousel owl-theme" style="height:260px;overflow: hidden;width:'+ screenWidth +'px">'+ portfolioImages +'</div>';
            }else{
                var carousel = '';
            }

            if(formData.blong !== '' && formData.blat !==''){
                var exportedStoreMap =   '<div class="col-lg-12 storeMapContainer" style="margin-top:50px;padding-right: 25px;">' +
                    '                          <div id="storeMap"></div>' +
                    '                          <div id="button-container"><i class="fa-solid fa-diamond-turn-right"></i> '+ (renderLang() === "el" ? "Οδηγίες" : "Directions") +'</div>' +
                    '                     </div>';
            }else{
                var exportedStoreMap = '';
            }

            exportedHtml += '<div class="row infosContanerC">' + carousel +
                '        <div class="col-lg-12" style="text-align:center;padding:0px;">' + exportedStoreMap +
                '                   <div class="iconDisplay profile-icon"><img class="barberIcon" style="" src="images/barbers/'+formData.businessLogo+'"></div>' +
                '        </div>' +
                '                   <div class="col-lg-12" style="padding-right: 25px;">' +
                '                           <div><h1>'+ formData.businessName+'</h1></div>' +
                '                          <div><small>'+ formData.businessAddress+'</small></div>' +
                '                   </div>' +
                '                   <div class="col-lg-12" style="padding: 0px;">' +
                '                           <div class="businessHoursContainer"><h2>'+ (renderLang() === "el" ? "Ωράριο λειτουργίας" : "Business Hours") +'</h2></div>' +
                '                           ' +
                '                               ' +
                 exportedPhoneInfo +
                '                           ' +
                '                          <div>'+ businessHours +'</div>' +
                '                   </div>' +
                '                   <div class="col-lg-12" style="margin-top:40px;padding-right: 25px;">' +
                '                       <div style="width: 100%">' +
                '                           <h3>'+ (renderLang() === "el" ? "Κανόνες υγιεινής και ασφάλειας του χώρου" : "Venue Health and Safety Rules") +'</h3> ' +
                '                           <div>' +
                '                               <div style="display: flex;margin-bottom: 10px;justify-content: space-between;padding-top: 10px;"><div style="font-size: 15px;"><i class="fa-solid fa-mask-face fa-2xl customFA"></i></div><div style="font-size: 12px;">'+ (renderLang() === "el" ? "Οι εργαζόμενοι φορούν μάσκες" : "Employees wear masks") +'</div></div>' +
                '                               <div  style="display: flex;margin-bottom: 10px;justify-content: space-between;padding-top: 10px;"><div style="font-size: 15px;"><i class="fa-solid fa-hand-sparkles fa-2xl customFA"></i></div><div style="font-size: 12px;">'+ (renderLang() === "el" ? "Οι εργαζόμενοι φορούν γάντια μίας χρήσης" : "Employees wear disposable gloves") +'</div></div>' +
                '                               <div  style="display: flex;margin-bottom: 10px;justify-content: space-between;padding-top: 10px;"><div style="font-size: 15px;"><i class="fa-solid fa-spray-can-sparkles fa-2xl customFA" style="margin-left: 7px;"></i></div><div style="text-align: end;font-size: 12px;" >'+ (renderLang() === "el" ? "Απολύμανση όλων των επιφανειών στο χώρο εργασίας" : "Disinfection of all surfaces in the workplace") +'</div></div>' +
                '                               <div  style="display: flex;margin-bottom: 10px;justify-content: space-between;padding-top: 10px;"><div style="font-size: 15px;"><i class="fa-solid fa-people-group fa-2xl customFA"></i></div><div style="font-size: 12px;">'+ (renderLang() === "el" ? "Απολύμανση μεταξύ των πελατών" : "Disinfection between clients") +'</div></div>' +
                '                               <div  style="display: flex;margin-bottom: 20px;justify-content: space-between;padding-top: 10px;"><div style="font-size: 15px;"><i class="fa-solid fa-people-arrows fa-2xl customFA"></i></div><div style="font-size: 12px;">'+ (renderLang() === "el" ? "Διατήρηση κοινωνικών αποστάσεων" : "Maintain social distancing") +'</div></div>' +
                '                           </div>' +
                '                       </div>' +
                '                   </div>' +
                '               </div>';
            found = true;
        }
        if(screen === 'user'){
            $('#removeTitle').html((renderLang() === "el" ? "Ιστορικό χρήστη" : "User History"));
            $('title').html((renderLang() === "el" ? "Ιστορικό χρήστη" : "User History")+' | '+formData.businessName);
            const user = JSON.parse(localStorage.getItem('users'));
            var servicesHtmlUpcomming = '';
            var servicesHtmlCompleted = '';
            servicesHtmlUpcomming += '<div class="row" style="margin:0px;margin-top: auto;margin-bottom:auto;width: 100%;">';
            servicesHtmlCompleted += '<div class="row" style="margin:0px;margin-top: auto;margin-bottom:auto;width: 100%;">';
            let appointments = JSON.parse(localStorage.getItem('appointments'));
            let currentDate = new Date();
            currentDate.setSeconds(0);
            currentDate.setMilliseconds(0);
            var completedMetr = 0;
            var upcommingMetr = 0;
            var start = 0;
            if(appointments){
                appointments.sort((a, b) => new Date(a.appointmentInfos.onDate + ' ' + a.appointmentInfos.startTime) - new Date(b.appointmentInfos.onDate + ' ' + b.appointmentInfos.startTime));
                for(let i = 0; i < appointments.length; i++) {
                    let appointment = appointments[i];
                    let appointmentDate = new Date(appointment.appointmentInfos.onDate + ' ' + appointment.appointmentInfos.startTime);
                    let appointmentEndDate = new Date(appointment.appointmentInfos.onDate + ' ' + appointment.appointmentInfos.endTime);
                    let services = appointment.services.map(service => service.name).join(", ");
                    if(appointment.appointmentInfos.isSos === 'false'){
                        var haircutPrice = appointment.haircutPrice;
                    }else{
                        if(appointment.servicesPrice){
                            var constructedPrice = appointment.haircutPrice +  appointment.servicesPrice;
                        }else{
                            var constructedPrice = appointment.haircutPrice * 2;
                        }
                        var haircutPrice = '<i class="fa customFA fa-caret-up" aria-hidden="true" style="FONT-SIZE: 25px;margin-right: 10px;"></i>'+constructedPrice;
                    }
                    if(appointment.lat){
                        var constructedAddress = '<div class="col-lg-12" style="padding: 10px;text-align: center;border-bottom: 3px dashed #2d2d2d;">📍 '+ appointment.odos + ' '+appointment.arithmos+ ' '+ appointment.polh+'</div>';
                    }else{
                        var constructedAddress = '';
                    }
                    // Upcoming appointments
                    if(currentDate < appointmentEndDate) {
                        upcommingMetr++;
                        if(start === 0) {
                            // Format for the first upcoming appointment
                            let borderClass = "";
                            if(currentDate >= appointmentDate && currentDate <= appointmentEndDate) {
                                // If the current time is within the appointment start and end time, add border
                                borderClass = "blink-border";
                            }
                            var duration = formatTime(appointment.haircutTime,renderLang());
                            servicesHtmlUpcomming += '        <div class="row previewBox-user '+ borderClass +'"> ' +
                                '                          <div class="col-lg-12 previewContDateTime">'+ formatDate(appointment.appointmentInfos.onDate) +' '+ appointment.timePreviewSlot +'</div>' +
                                '                          <div class="col-lg-12 customServicesPreviewScreen" style="background-image: url('+ appointment.barberIcon +');border-top-right-radius:0px;"> ' +
                                '                                      <div style="background-color: rgb(36 36 36 / 70%);border-top-right-radius: 10px;">'+ (renderLang() === "el" ? "Επιλεγμένες υπηρεσίες" : "Selected services") +'</div>' +
                                '                                      <div style="background-color: rgb(36 36 36 / 70%);border-bottom-right-radius: 10px;">' +
                                '                                           <span style="font-size: 12px;width: 100%;">'+ services +' '+ (renderLang() === "el" ? "με" : "with") +'  <span style="color: #0dda92">'+appointment.barberName+'</span>' +
                                '                                      </div>' +
                                '                          </div>' + constructedAddress +
                                '                          <div class="col-lg-6 " style="width:50%;padding: 10px;display: flex;">' +
                                '                             <span class="timePreviewCont" style="margin-left: 0px;margin-right: auto;"> ≈ '+ (duration) +' ⌛</span>' +
                                '                          </div>' +
                                '                          <div class="col-lg-6" style="text-align: right;width:50%;padding: 10px;display: flex;">' +
                                '                              <span class="pricePreviewCont"> '+ haircutPrice +' €</span>' +
                                '                          </div>' +
                                '                    </div>';
                            start++;
                        } else {
                            // Format for the rest of the upcoming appointments
                            servicesHtmlUpcomming += '        <div class="row previewBox-user" style=""> ' +
                                '                          <div class="col-lg-12 row previewContDateTime" style="padding-bottom: 10px;margin: 0px;">' +
                                '                               <p style="font-size: 15px;margin-bottom: 1px;width: 100%;">'+ formatDate(appointment.appointmentInfos.onDate) +' '+ appointment.timePreviewSlot +'</p> ' +
                                '                                           <span style="font-size: 12px;width: 100%;">'+ services +' '+ (renderLang() === "el" ? "με" : "with") +'  <span style="color: #0dda92">'+appointment.barberName+'</span>' +
                                '                                <div class="pricePreviewCont" style="position: absolute;right: -1px;top: 0px;background-color: var(--secondary-color);border-bottom-left-radius: 5px;padding: 3px;border-bottom-left-radius: 10px;"> '+ haircutPrice +' €</div>' +
                                '                           </div>' + constructedAddress +
                                '                    </div>';
                        }
                    }
                    // Completed appointments
                    else if(currentDate >= appointmentEndDate) {
                        completedMetr++;
                        // Format for completed appointments
                        servicesHtmlCompleted += '        <div class="row previewBox-user" style=""> ' +
                            '                          <div class="col-lg-12 row previewContDateTime" style="padding-bottom: 10px;margin: 0px;">' +
                            '                               <p style="font-size: 15px;margin-bottom: 1px;width: 100%;">'+ formatDate(appointment.appointmentInfos.onDate) +' '+ appointment.timePreviewSlot +'</p> ' +
                            '                                           <span style="font-size: 12px;">'+ services +' '+ (renderLang() === "el" ? "με" : "with") +'  <span style="color: #0dda92">'+appointment.barberName+'</span>' +
                            '                                <div class="pricePreviewCont" style="position: absolute;right: -1px;top: 0px;background-color: var(--secondary-color);border-bottom-left-radius: 5px;padding: 3px;border-bottom-left-radius: 10px;">  '+ haircutPrice +' €</div>' +
                            '                           </div>' + constructedAddress +
                            '                    </div>';
                    }
                }
            }
            if(upcommingMetr === 0) {
                servicesHtmlUpcomming += '' +
                    '<div class="row previewBox-user-cal" style="width: 100%;">' +
                    '<div class="" style="width: 100%;height: 260px;text-align: center;">' +
                    '   <i style="color: whitesmoke;font-size: 80px; margin-bottom: 30px;" class="customFA fa fa-calendar-times-o" aria-hidden="true"></i>' +
                    '   <h3>'+ (renderLang() === "el" ? "Δεν υπάρχουν επερχόμενες κρατήσεις" : "No upcoming bookings") +'</h3>' +
                    '   <p>'+ (renderLang() === "el" ? "Αν θέλετε να κλείσετε ένα ραντεβού, κάντε κλικ παρακάτω!" : "If you’d like to book an appointment, click below!") +'</p>' +
                    '   <button id="gotoAppointment" class="customButton" style="width: 100%;padding: 10px; border-radius: 10px;font-size: 16px;">' +
                    '       <span>'+ (renderLang() === "el" ? "Μεταβείτε στη σελίδα κρατήσεων" : "Go to the Booking Page") +'</span>' +
                    '   </button>' +
                    '</div>' +
                    '</div>';
            }
            if(completedMetr === 0){
                servicesHtmlCompleted += '' +
                    '<div class="row previewBox-user-cal" style="width: 100%;">' +
                    '<div class="" style="width: 100%;height: 260px;text-align: center;">' +
                    '   <i style="color: whitesmoke;font-size: 80px; margin-bottom: 30px;" class="customFA fa fa-calendar-times-o" aria-hidden="true"></i>' +
                    '   <h3>'+ (renderLang() === "el" ? "Κανένα ολοκληρωμένο ραντεβού" : "No completed appointment") +'</h3>' +
                    '   <p>'+ (renderLang() === "el" ? "Αν θέλετε να κλείσετε ένα ραντεβού, κάντε κλικ παρακάτω!" : "If you’d like to book an appointment, click below!") +'</p>' +
                    '   <button id="gotoAppointment" class="customButton" style="width: 100%;padding: 10px; border-radius: 10px;font-size: 16px;">' +
                    '       <span>'+ (renderLang() === "el" ? "Μεταβείτε στη σελίδα κρατήσεων" : "Go to the Booking Page") +'</span>' +
                    '   </button>' +
                    '</div>' +
                    '</div>';
            }
            servicesHtmlUpcomming += '</div>';
            servicesHtmlCompleted += '</div>';
            if(user && user[0].clientName){
                var exportedHtmlUser = ' <div class="row" style="margin:0px;margin-top: auto;margin-bottom:auto;width: 100%;"> ' +
                    '                              <div class="col-lg-12 row serviceType oneTapService" style="padding: 10px;cursor: pointer;margin-bottom:10px!important;"> ' +
                    '                                  <div class="col-lg-2 iconDisplayTypes">' +
                    '                                       <div style="margin: auto;"><img style="margin: auto;width: 60px; height: 60px;border-radius: 100%;" src="images/unknownUser.png"></div>' +
                    '                                   </div>  ' +
                    '                                  <div class="col-lg-10 serviceDisplay" style="margin: auto;">' +
                    '                                          <div class="col-lg-12 serviceTypeText" id="outcall" style="font-size: 1rem;text-transform: capitalize;"> '+ user[0].clientName +' '+ user[0].clientSurname+'<p style="font-size: 12px">'+ user[0].clientEmail +'</p></div> ' +
                    '                                  </div>' +
                    '                               </div>' +
                    '                               </div>';
            }else{
                var exportedHtmlUser = ' ';
            }
            var exportedHtml = '     <div class="ibox" style="box-shadow: 0px 0px 40px -20px black;    width: 100%;">' +
                '                       <div class="tabs-container">' + exportedHtmlUser +
                '                           <div class="ibox-title" style="border-bottom: 1px solid #424242!important;">' +
                '                               <h5>' +(renderLang() === "el" ? "Ραντεβού" : "Appointments")+ '</h5>' +
                '                           </div>' +
                '                           <ul class="nav nav-tabs">' +
                '<li style="max-width:50%;width:50%;overflow: hidden;text-align: center;min-width: fit-content;">' +
                '   <a class="nav-link active show" data-toggle="tab" href="#appointmentsTab-1" style="font-size: 14px;padding: 15px 0px 0px 15%;display: flex;height: 50px;"><i style="margin-top: -4px;" class="fa fa-2x fa-calendar" aria-hidden="true"></i>'+ (renderLang() === "el" ? "Επερχόμενα" : "Upcoming") +'</a>' +
                '</li>' +
                '<li style="max-width:50%;width:50%;overflow: hidden;text-align: center;min-width: fit-content;">' +
                '   <a class="nav-link " data-toggle="tab" href="#appointmentsTab-2" style="font-size: 14px;padding: 15px 0px 0px 15px;display: flex;height: 50px;"><i style="margin-top: -4px;" class="fa fa-2x fa-clock-o" aria-hidden="true"></i>'+ (renderLang() === "el" ? "Ολοκληρωμένα" : "Completed") +'</a>' +
                '</li>' +
                '</ul>' +
                '                           <div class="ibox-content tab-content" style="display: flex;padding: 0px;padding-top: 20px;">' +
                '                               <div class="tab-pane tab-1-content active" id="appointmentsTab-1">' + servicesHtmlUpcomming + '</div>' +
                '                               <div class="tab-pane tab-2-content" id="appointmentsTab-2">' + servicesHtmlCompleted + '</div>' +
                '                           </div>' +
                '                       </div>' +
                '                   </div>';

            var selectedMessage = renderLang() === "el" ? "Δεν απαιτείται λογαριασμός! Τα δεδομένα που προβάλλονται εδώ αποθηκεύονται στον τοπικό αποθηκευτικό χώρο αυτής της συσκευής. Προσοχή, η εκκαθάριση των cookies ή η αλλαγή της συσκευής θα διαγράψει αυτά τα δεδομένα." : "No account is needed here! Data that is previewed are saved on this device's local storage. Beware, clearing cookies or changing the device will erase this data.";
            exportedHtml += '<div id="toast-container" class="toast-top-right col-lg-12" aria-live="polite" role="alert" style="z-index: 0;position: relative; top: 0px;left: 0px;margin-top: 30px;margin-bottom: 30px;">' +
                '<div class="toast toast-info toastrCustom">' +
                '<div class="toast-message">'+ selectedMessage +'</div>' +
                '</div>' +
                '</div>';
            found = true;
        }
        if(screen === 'bookAppointment'){
            $('.appScreens').css('display','none');
            $('#bookAppointment').css('display','block');
            $('#removeTitle').html((renderLang() === "el" ? "Κλείστε ραντεβού" : "Book Appointment"));
            $('title').html((renderLang() === "el" ? "Κλείστε ραντεβού" : "Book Appointment")+' | '+formData.businessName);
            if(formData.hasClosedAppointment){
                update_data_center('hasClosedAppointment',false);
                render_app();
            }else{
                if(gatherFilledBookingScreens() !== false){
                    cached_screen_render(gatherFilledBookingScreens());
                }else{
                    render_app();
                }
            }

        }
        if(found){
            add_loader();
            setTimeout(function(){
                $('.appScreens').css('display','none');
                $('#'+screen).html(exportedHtml).css('display','flex');

                if(screen === 'user'){
                    const element = document.getElementById('gotoAppointment');
                    if (element) {
                        element.addEventListener('click', function() {
                            // Check if the target element has any existing click event listeners
                            const existingListeners = getEventListeners(this);
                            if (existingListeners && existingListeners.click && existingListeners.click.length > 0) {
                                // An existing click event listener is already attached, so do nothing
                                return;
                            }
                            // Trigger the click event of elements with the class "main-icon"
                            const mainIcons = document.getElementsByClassName('main-icon');
                            for (let i = 0; i < mainIcons.length; i++) {
                                mainIcons[i].click();
                            }
                        });
                    }
                }

                if(screen === 'qrcode'){
                    var config = {
                        text: "https://gm.barbreon.com", // Content
                        width: 240, // Widht
                        height: 240, // Height
                        colorDark: "#ffffff", // Dark color
                        colorLight: "rgba(255,198,0,0)", // Light color
                        // quietZone
                        quietZone: 0,
                        // === Logo
                        logo: 'images/barbers/'+formData.businessLogo, // LOGO
                        logoWidth:80,
                        logoHeight:80,
                        logoBackgroundTransparent: true, // Whether use transparent image, default is false
                        // === Posotion Pattern(Eye) Color
                        PO: 'var(--extra-color)', // Global Position Outer color. if not set, the defaut is `colorDark`
                        PI: 'var(--extra-color)', // Global Position Inner color. if not set, the defaut is `colorDark`
                        AI: 'var(--extra-color)',
                        AO: 'var(--extra-color)',
                        correctLevel: QRCode.CorrectLevel.H, // L, M, Q, H
                        dotScale: 0.5, 
                        drawer: 'svg'
                    }
                    new QRCode(document.getElementById("qrcodeImage"), config);
                }
                if(screen === 'infos'){
                    setTimeout(function(){
                        $(".owl-carousel").owlCarousel({
                            items: 1,
                            loop: true,
                            autoplay: true,
                            autoplayTimeout: 2000,
                            animateOut: 'fadeOut',
                            nav: false,
                            lazyLoad: true
                        });
                        // Change the color of the dots
                        $('.owl-dot span').css({
                            'background-color': 'var(--extra-color)',
                            'opacity': '1'
                        });
                        if(formData.blong !== '' && formData.blat !==''){
                            setupStoreMap([formData.blong, formData.blat]);
                        }else{
                            remove_loader();
                        }
                    },500);
                }else{
                    remove_loader();
                }

            },200);
        }
    },timeout);
}

function formatDate(dateStr) {
    // Split the date string on "-"
    let parts = dateStr.split("-");

    // Reorder the parts as [day, month, year]
    let reorderedParts = [parts[2], parts[1], parts[0]];

    // Join the parts back together with "-"
    return reorderedParts.join("-");
}

function getEventListeners(element) {
    return element.__proto__.__proto__.__proto__.__proto__;
}
/**
 * App screens render end
 */