//accompanying js file for fmxj demo html file.
//dependencies: fmxj.js. fmxj.css




//define PHP relay info if using it, otherwise set to null
//var relay = null;
//Credentials are not being passed here, but are hardcoded into the PHP file.
//If running your own authentication routine in JS you can add u an p properties to this object
//They will be sent via POST to your PHP page, which will use them to authenticate to FMS
//This is the SeedCode Test Server so be kind to it!!
var relay = {"php":"fmxjRelay.php","server":"sc-fms13-fms.fmsdb.com","protocol":"https","port":"443"};
//var relay = {"php":"fmxjRelay.php","server":"192.168.1.10"};


//***************FUNCTIONS*********************

function createMessage(js, utc, start, num){
	var end = new Date().getTime();
	var dlc = utc - start;
	var cc = end - utc;
	var tt = end - start;
	var total = js.length;
	if(!total){total = 1};
	if(!num){var num= total};
	var message = "<span class=\"resultHeader\">" + total + 
	" FileMaker records downloaded in " + dlc + " milliseconds</span>\n" +
	"<span class=\"resultHeader\">" +  
	"FMPXMLRESULT converted to JS objects in " + cc + " milliseconds</span>\n" +
	"<span class=\"resultHeader\">Displaying the first " + num + " \"stringified\" objects.</span>\n" +
	"<span class=\"resultHeader\">" + (end - start) + " total milliseconds.</span>\n\n";
	return message;
	
};

function createMessageShort(js, utc, start, num){
	var end = new Date().getTime();
	var dlc = utc - start;
	var cc = end - utc;
	var tt = end - start;
	var total = js.length;
	if(!total){total = 1};
	if(!num){var num= total};
	var message = "<span class=\"resultHeader\">&#8226;" + total + 
	" FileMaker records downloaded in " + dlc + " milliseconds</span>\n" +
	"<span class=\"resultHeader\">" +  
	"FMPXMLRESULT converted to JS objects in " + cc + " milliseconds</span>\n" +
	"<span class=\"resultHeader\">Displaying the first " + num + " records as \"stringified\" objects.</span>\n"
	return message;
	
};

function createDisplay(js, utc, start, num){
	var indent = 4; // JSON indent
	var display = JSON.stringify(js.slice(0,num), null, indent);
	var message = createMessage(js,utc,start,num);
	return message+display ;
};

function updateElement(id, value, append){
	if(append){document.getElementById(id).innerHTML += value;}
	else{document.getElementById(id).innerHTML = value;}
};

function editQuery(source){
	var firstRecord = source[0];
	var recid = firstRecord["-recid"];
	var recordStatus = firstRecord["Status"] ;
	var recordModId = firstRecord["-modid"] ;
	//create edit object and requests array
	var edit = {"-recid":recid};
	var requests = [edit];
	//toggle status
	if ( recordStatus == "Open" ) {var newStatus = "Closed" } else {var newStatus = "Open" } ;
	edit["Status"] = newStatus ;
	edit["-modid"] = recordModId ;
	return fmxj.editRecordURL( "Events" , "Events" , edit ) ;
};

//***************Load Sidebar*********************

updateElement("sb",'<ul style="margin-top:0px;"><li class="sidebaritem"><a href="../index.html">Home</a></li><li class="sidebaritem">Data Functions<ul><li class="smallitem"><a href="findRecords.html">findRecordsURL()</a></li><li class="smallitem"><a href="editRecord.html">editRecordURL()</a></li><li class="smallitem"><a href="deleteRecord.html">deleteRecordURL()</a></li></ul></li><li class="sidebaritem">Design Functions<ul><li class="smallitem"><a href="fileNames.html">fileNamesURL()</a></li><li class="smallitem"><a href="layoutNames.html">layoutNamesURL()</a></li><li class="smallitem"><a href="layoutFields.html">layoutFieldsURL()</a></li></ul></li><li class="sidebaritem">Server Functions<ul><li class="smallitem" id="pql"><a href="postQuery.html">postQueryFMS()</a></li></ul></li><li class="sidebaritem">Object Functions<ul><li class="smallitem"><a href="filterObjects.html">filterObjects()</a></li><li class="smallitem"><a href="sortObjects.html">sortObjects()</a></li><li class="smallitem"><a href="nestObjects.html">nestObjects()</a></li></ul></li></ul>');

//***************SAMPLE DATA*********************

//each object in the array represents a find request
//standard calendar view requests
var requests = 
		[
			{"DateStart":"<=2/28/2014", "DateEnd":">=2/1/2014"},
			{"DateStart":"2/1/2014...2/28/2014"}
		] ;
		
// flgging the -omit property of a request with 1 designates it as an omit request.
var requestsOmit = 
		[
			{"DateStart":"<=2/28/2014","DateEnd":">=2/21/2014"},
			{"DateStart":"2/1/2014...2/28/2014"},
			{"Resource":"Example B","-omit":1}
		] ;

// object for new record. Don't specify -recid property.
var newRecord =
	    {
	      	"DateEnd": "02/25/2014",
	      	"DateStart": "02/25/2014",
	      	"Description": "test",
	     	"Status": "Open",
	     	"Summary": "test summary ubi"
	    };
		
//global filter Object display value
var filterObj =
	 	[
			{"id":"E4B04F12-E006-4928-A1E0-0E86EDF5641C"},
			{"id":"463BBEA9-404B-4979-8CC0-6F8F60EB0154"},
			{"id":"8CDA64C4-643D-4A64-9336-83BEF07F0CF4"}
		];
		
//global sort Object display value
var sortObjectJs =
	 	{
		"property1" : "DateStart",
		"order1" : "descend",
		"type1" : "date",
	 	"property2" : "Resource",
		"order2" : "ascend",
		"type2" : "string" 
   	 	};
					
var sortObject =	
		{
			"field1" : "DateStart" ,
			"order1" : "descend" ,
			"field2" : "id" ,
			"order2" : "ascend"
		} ;
		
//end sample data