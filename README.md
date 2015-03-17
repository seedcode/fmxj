#fmxj.js
###A Javascript based approach to FileMaker Custom Web Publishing

###With fmxj.js and simple JavaScript Objects you can

* Build complex queries and POST them to FileMaker Server
* Return FileMaker parent and child records as JavaScript Objects/JSON
* Create, edit and delete FileMaker records
* Filter and sort Javascript objects locally with complex criteria.

Working examples and basic function descriptions are available at the <a href="http://www.seedcode.com/fmxj/fmxj.html" target="_blank">fmxj example page</a>.

fmxj.js does not have any dependencies, but does use <a href="https://github.com/LeaVerou/prism" target="_blank">prism.js</a> for the demo page code blocks and <a href="http://momentjs.com/" target="_blank">moment.js</a> for the postQueryFMS() demo page resultClass example.

fmxj.js is designed to do the data interchange work with FileMaker Server in JavaScript. Query strings are created from JavaScript Objects and then sent as a POST to FileMaker's XML Web Publishing Engine. An XML FMPXMLRESULT is returned and converted into JavaScript Objects/JSON by fmxj. The core idea is to do as little as possible on the FileMaker server and shift what we can to the client and JavaScript processes. Supporting FileMaker's Web Publishing can be challenging so removing as many variabes as possible is one of our goals with this project.

POSTS can be done directly to the FileMaker Server's XML WPE or a simple PHP relay can be used to get around cross-domain issues and provide more secure authentication options.  With the goal of doing as little as possible on the Server, we were a little disappointed to need to rely on PHP at all, but there are some limitations to interacting with the FMS XML API directly, and a PHP relay is the simplest way to get around them.  Specifically it's much easier to add access headers to a PHP page than it is to Apache! See more on the PHP relay below in the **postQueryFMS()** function.

##Functions for working with FileMaker Server
The **postQueryFMS()** is the primary function used for POSTing queries to FileMaker Server via httpXMLRequest and then converting the FMPXMLRESULT xml results into JavaScript objects for callback.  Queries can be created easily from JavaScript objects using the  fmxj URL functions below.

***
**postQueryFMS(query, callBackOnReady[, callBackOnDownload, phpRelay, classResult, max, nestPortals])**

* **query:** string: The query, built by one of the fmxj URL functions
* **callBackOnReady:** function: The handler function for the returned array of objects.
* **callBackOnDownload:** (optional) function: The handler function for the POST *e.loaded* progress reports.
* **phpRelay:** (optional) object: specifies the server address and name of the php relay file being used.
* **classResult:** (optional) object: defines "classes" the result objects rather then letting the FileMaker layout do this.
* **max:** (optional) number: limts the number of results returned per "page." If not all query results are returned in a page then the function will POST for the next page recursively until all results are returned. This argument will override any max argument specified in the query object, but not the skip.
* **nestPortals:** (optional) boolean: Determines whether realted fields on the target layout will be treated as nested arrays. If set to *true*, field values will become nested arrays regardless of number of fields, number of portal rows or even if no portal is present on the layout. If set to *false* then the field values will be set to the top level of the object with their full related field name. If set to false and there is a portal on the layout then just the first portal row will be returned, not nested. Default is false.

An optional handler function can be passed as well to report the download progress from FileMaker Server.  Note that FileMaker server does not pass the *e.total* property in it's progres reporting, only the bytes downloded *e.loaded*.

**Example of formatted results (stringified JSON) returned by the postQueryFMS function for a find query:**

```json
[
    {
        "-recid": "6198",
        "-modid": "116",
        "DateEnd": "02/09/2014",
        "DateStart": "02/09/2014",
        "Description": "",
        "id": "7A2E442C-3782-497F-A539-4495F1B28806",
        "id_contact": "ED3C1292-EBC2-4027-82D2-33ADFB590A1D",
        "id_Phase": "",
        "id_Project": "P00031",
        "Resource": "Example A",
        "Status": "Open",
        "Summary": "Begin Production",
        "TimeEnd": "",
        "TimeStart": "",
        "z_LinkedWithinProject": "1",
        "z_MilestoneSort": "",
        "z_Notified": "",
        "z_Repeating_id": ""
    },
    {
        "-recid": "6199",
        "-modid": "5",
        "DateEnd": "02/10/2014",
        "DateStart": "02/10/2014",
        "Description": "",
        "id": "D546B0FF-E87C-41CD-8B1C-A3B291E7FCCD",
        "id_contact": "2C2CD8FB-EFD9-44E9-91B0-884C01D887EB",
        "id_Phase": "",
        "id_Project": "P00031",
        "Resource": "Example B",
        "Status": "Open",
        "Summary": "Begin Production",
        "TimeEnd": "",
        "TimeStart": "",
        "z_LinkedWithinProject": "1",
        "z_MilestoneSort": "",
        "z_Notified": "",
        "z_Repeating_id": ""
    },
    {
        "-recid": "6201",
        "-modid": "4",
        "DateEnd": "02/12/2014",
        "DateStart": "02/12/2014",
        "Description": "",
        "id": "9F86C241-8A64-4B82-9B58-CEB5131FA125",
        "id_contact": "D4C1F32F-C2D5-4584-947C-4F409502C157",
        "id_Phase": "",
        "id_Project": "P00031",
        "Resource": "Example D",
        "Status": "Open",
        "Summary": "Begin Production",
        "TimeEnd": "",
        "TimeStart": "",
        "z_LinkedWithinProject": "1",
        "z_MilestoneSort": "",
        "z_Notified": "",
        "z_Repeating_id": ""
    }
]
```
**Example of formatted results (stringified JSON) returned by the postQueryFMS function for a find query with a Portal on the target layout.** **nestPortals** must be set to *true* for this nesting to take place, otherwise just the first portal row will be returned at the top level.  *(We recommend using this sparingly as it can put a significantly higher load on the server, and we'll be exploring some client side alternitives to this.)*

```json
[
    {
        "-recid": "1",
        "-modid": "0",
        "id": "338794336203723354493363901762748606262",
        "NameFirst": "Diane",
        "NameLast": "Ort",
        "Status": "Customer",
        "-ContactInfo": [
            {
                "Type": "Email",
                "Value": "diane@ort.com"
            },
            {
                "Type": "Phone",
                "Value": "(415) 393-6166"
            },
            {
                "Type": "URL",
                "Value": "http://www.dianeort.com"
            }
        ]
    },
    {
        "-recid": "2",
        "-modid": "0",
        "id": "262473748365757206478007125406773627812",
        "NameFirst": "Zane",
        "NameLast": "Opunui",
        "Status": "Customer",
        "-ContactInfo": [
            {
                "Type": "Email",
                "Value": "zane@opunui.com"
            },
            {
                "Type": "Phone",
                "Value": "(434) 296-3666"
            },
            {
                "Type": "URL",
                "Value": "http://www.zaneopunui.com"
            }
        ]
    },
    {
        "-recid": "3",
        "-modid": "1",
        "id": "24517341939382263356133708272977092954",
        "NameFirst": "Lea",
        "NameLast": "Knighton",
        "Status": "Customer",
        "-ContactInfo": [
            {
                "Type": "Email",
                "Value": "lea@knighton.com"
            },
            {
                "Type": "Phone",
                "Value": "(702) 878-2130"
            },
            {
                "Type": "URL",
                "Value": "http://www.leaknighton.com"
            }
        ]
    }
]
```
**Deployment and the phpRelay**

You can use fmxj without any PHP providing all the JavaScript is hosted on the FileMaker Server.  In this case, the JavaScript will do the httpXMLRequest POST directly to FileMaker Server's XML API.  If the Guest account is not enabled then you will be prompted for FileMaker authentication from the browser.  This is simple **Basic Authentication**, so may not be suitable for your deployment.  If you're using this deployment, you can simply not pass the optional **phpRelay** argument or pass **null** to it.

You will need to use the php Relay if your web server and Filemaker server are located remotely from each other.  FileMaker server does not allow cross domain httpXMLRequests directly to the XML API, and changing this involves modifying the Web Server settings.  This is actually pretty easy in Windows/IIS, but not so in Mac/FileMaker Server/Apache.  In either case, dropping a single PHP relay file into the FileMaker Server's root directory is much easier.  

fmxj comes with a simple PHP file (fmxjRelay.PHP) that you can use for this.  You'll then do your POST to the PHP file which will then do the identical POST locally to the FileMaker server using cURL and then relay the XML results back. When doing this you'll need to have the fmxjRelay.php file in your FileMaker WPE's root directory. You'll then need to define an object in JavaScript and pass it as the phpRelay argument.

**Supported Object Properties Are:**

* **"php":** the php file name (required)
* **"server":** the filemaker server address (optional, you may use the php file with the JS running locally)
* **"protocol":** http / https (optional)
* **"port"":** 80/443 (optional)
* **"user":** FileMaker Account Name (optional)
* **"pass":** FileMaker Account Password (optional)

User name and password can be passed as part of the object.  They are sent via POST, so can potentially be secured if both the web server and Filemaker Server are using SSL, otherwise passing the credentials like this is equivalent to **Basic Authentication**.  You also have the option of hardcoding the FileMaker credentials in the PHP file so they're not passed via JavaScript at all.

**Relay Examples**

```javascript
//create two objects in a JSON array, each one is a FileMaker Find Request
var requests = [{"Resources":"Example A"},{"Resources":"Example B"}];

//build query from our array
var query = fmxj.findRecordsURL("Events","Events" , requests); 

//specify FileMaker Server we're posting to
var relay = {"php":"fmxjRelay.php","server":"seedcode.com"};  

//now do the POST (without any on Download handler);
fmxj.postQueryFMS(query, onReadyFunction, null, relay);
```

POSTING FileMaker credentials to a secure server would use an object like this:

```javascript
//specify FileMaker https Server we're posting to with credentials
var relay = {"php":"fmxjRelay.php","server":"seedcode.com","protocol":"https","port":"443","user":varUser,"pass":varPass};
```

**Remember!**  Both the Web Server and the FileMaker Server need to be runnning SSL for this transaction to be secure.  There's a good article on this [here](http://www.troyhunt.com/2013/05/your-login-form-posts-to-https-but-you.html).

**classResult Example**

Specify an object "class" for the results using the below syntax and pass it as the resultClass argument. This example uses <a href="http://momentjs.com/" target="_blank">moment.js.</a> FileMaker Times are "floating" so we need to specify a time zone to solidify the events in the continuum.

```javascript
var requests =	[
	{ "DateStart" : "<=2/28/2014" , "DateEnd" : ">=2/1/2014" } ,
	{ "DateStart" : "2/1/2014...2/28/2014" }
				] ;
var query = fmxj.findRecordsURL("Events", "Events", requests);
var query = fmxj.findRecordsURL("Events", "Events", requests);
//define object class for the results and pass that as the class argument.
var fcObject = 	{
	"id" : {
			"idField":"id",
			"getValue" : function(f){
				var field = this["idField"];
				return f(field);
			},
		},
	"title" : {
			"titleField":"Summary",
			"getValue" : function(f){
				var field = this["titleField"];
				return f(field);
			},
		},
	"allDay" : {
			"timeStartField" : "TimeStart",
			"getValue" : function(f){
				var field = this["timeStartField"];
				if(f(field).length){//we have a start time so this is false
					return false;
				}
				else{
					return true;
				}
			},
		},
	"start" : {
		"timeStartField" : "TimeStart",
		"dateStartField" : "DateStart",
		"yearFormat" : "MM-DD-YYYY",
		"timeFormat" : "HH:mm",
		"timezone" : "America/Los_Angeles",
		"getValue" : function(f){
			var time = this["timeStartField"];
			var date = this["dateStartField"];
			var zone = this["timezone"];
			var yearFormat = this["yearFormat"];
			var timeFormat = this["timeFormat"];
			var date = moment( f(date) + " " + f(time) , yearFormat + " " + timeFormat );
			return date.tz(zone).format();
		},
	},
	"end" : {
		"timeEndField" : "TimeEnd",
		"dateEndField" : "DateEnd",
		"dateStartField" : "DateStart", //if no end date is specified we'll need to use the start date.
		"yearFormat" : "MM-DD-YYYY",
		"timeFormat" : "HH:mm",
		"timezone" : "America/Los_Angeles",
		"getValue" : function(f){
			var time = this["timeEndField"];
			var date = this["dateEndField"];
			var sdate = this["dateStartField"];
			var zone = this["timezone"];
			var yearFormat = this["yearFormat"];
			var timeFormat = this["timeFormat"];
			//use start date if no end date
			if(!f(date)){ var d = f(sdate) } else { var d = f(date)};
			if(f(time).length){
				d = moment( d + " " + f(time) , yearFormat + " " + timeFormat );
			}
			else
			{
				d = moment( d , yearFormat + " " + timeFormat ).add( 1, "days");
			};
			return d.tz(zone).format();
		},
	},
	"description" : {
			"descriptionField":"Description",
			"getValue" : function(f){
				var field = this["descriptionField"];
				return f(field);
			},
		},
	"resource" : {
			"resourceField":"Resource",
			"getValue" : function(f){
				var field = this["resourceField"];
				return f(field);
			},
		},
	"status" : {
			"statusField":"Status",
			"getValue" : function(f){
				var field = this["statusField"];
				return f(field);
			},
		},
	"contactId" : {
			"contactIdFieldName":"id_contact",
			"getValue" : function(f){
				var field = this["contactIdFieldName"];
				return f(field);
			},
		},
	"projectId" : {
			"projectIdField":"id_project",
			"getValue" : function(f){
				var field = this["projectIdField"];
				return f(field);
			},
		},
	"fmRecordId" : {
			"fmRecordIdField":"-recid",
			"getValue" : function(f){
				var field = this["fmRecordIdField"];
				return f(field);
			},
		},
	"fmModId" : {
			"fmModIdField":"-modid",
			"getValue" : function(f){
				var field = this["fmModIdField"];
				return f(field);
			},
		},
	};
//make call with our custom object definition
fmxj.postQueryFMS(query, writeResults, writeDownload, relay, fcObject);
```

results in objects like this:

```json
{
	"id": "7A2E442C-3782-497F-A539-4495F1B28806",
	"title": "Begin Production",
	"allDay": true,
	"start": "2014-02-08T23:00:00-08:00",
	"end": "2014-02-09T23:00:00-08:00",
	"description": "",
	"resource": "Example A",
	"status": "Open",
	"contactId": "ED3C1292-EBC2-4027-82D2-33ADFB590A1D",
	"projectId": "P00031",
	"fmRecordId": "6198",
	"fmModId": "178"
}
```

***
##Data Functions

These three functions are used to build the specific query type strings for the **postQueryFMS** function to POST.  The idea being that you can use existing objects or simple JSON to create complex query strings.

***
**findRecordsURL(fileName, layoutName, requests[, sort, max, skip])**

* **fileName:** string: The target FileMaker file
* **layoutName:** string: The target FileMaker layout in the above refernced file
* **requests:** array of objects: Each object in the array represents a FileMaker find request
* **sort:** (optional) object: Specifies a sort order for the query, options are ascend, descend or value list name
* **max:** (optional) number: The maximum number of records/objects to return
* **skip:** (optional) object: The number of rows to skip (like offset) before returning records/objects

**Example**

```javascript
//create two objects in a JSON array, each one is a FileMaker Find Request.
//will find all records with Resources = Example A OR Resources = Example B.
var requests = [{"Resources":"Example A"},{"Resources":"Example B"}];

// we want to sort these by StartDate descending and Resource ascending, so create an Object to define that. 
var sort = {"field1":"DateStart","sort1":"descend","field2":"Resource","sort2":"ascend"};

//build query from our array, our file and layout name are "Events"
var query = fmxj.findRecordsURL("Events", "Events", requests, sort);
```

**...returns:**

-db=Events&-lay=Events&-query=(q1);(q2)&-q1=Resources&-q1.value=Example A&-q2=Resources&-q2.value=Example B&-sortfield.1=DateStart&-sortorder.1=descend&-sortfield.2=Resource&-sortorder.2=ascend&-findquery

...which can now be passed to *postQueryFMS()*.

To specify a request as an *Omit* request, simply specify an -omit property in the object as 1, e.g.

```javascript
var requests = [{"Resources":"Example A","-omit":"1"}];
```

**...returns a query string for omiting all the records where the Resource is equal to Example A:**

-db=Events&-lay=Events&-query=!(q1)&-q1=Resources&-q1.value=Example A&-findquery


***
**editRecordURL(fileName, layoutName, editObj)**

* **fileName:** string: The target FileMaker file
* **layoutName:** string: The target FileMaker layout in the above refernced file
* **editObj:** object: An object where the properties represent the fields to be edited.

This function will create a -edit query for a FileMaker record if the -recid property is specified.  This represents the FileMaker Record ID of the record to edit.  Optionally a -modid property can be specified.  See the FileMaker <a href="https://fmhelp.filemaker.com/docs/13/en/fms13_cwp_xml.pdf" target="_blank"> CWP XML guide</a> for more info in using the -modid.

If the -recid property is not specified, then this function will create a -new query for generating a new record.   

**-edit Example**

```javascript
//Edit the Resource value of the record with a -recid of 6198.
//Edit the value to Example A 
var edit = {"-recid":"6198","Resources":"Example A"};

//build query from our object, our file and layout name are "Events"
var query = fmxj.editRecordURL("Events", "Events", edit);
```

**...returns:**

-db=Events&-lay=Events&-recid=6198&Resources=Example A&-edit

**-new Example**

```javascript
//Create a new record with Resources set to Example A and StartDate = to 1/11/2015
var newRecord = {"Resources":"Example A","StartDate":"1/11/2015"};

//build query from our object, our file and layout name are "Events"
var query = fmxj.editRecordURL("Events", "Events", newRecord);    
```

**...returns:**

-db=Events&-lay=Events&Resources=Example A&StartDate=1/11/2015&-new

...these queries can now be passed to *postQueryFMS()*.

***
**deleteRecordURL(fileName, layoutName, recid)**

* **fileName:** string: The target FileMaker file
* **layoutName:** string: The target FileMaker layout in the above refernced file
* **recid:** number: The -recid / Record ID of the record to delete

This function will create a -delete query for a FileMaker record with the specified -recid property.

**Example**

```javascript
//Delete the record with a -recid of 6198.
//build query from our recid, our file and layout name are "Events"
var query = fmxj.deleteRecordURL("Events" , "Events" , 6198);
```

**...returns:**

-db=Events&-lay=Events&-recid=6198&-delete

...which can now be passed to *postQueryFMS()*.

***
##Design Functions

These three functions are used to build the specific query type strings for the **postQueryFMS** function to POST.  These three are for getting facts about the files on the server. The layouts in a file, and the fields on a layout.

***
**fileNamesURL()**

* **fileName:** string: The target FileMaker file
* **layoutName:** string: The target FileMaker layout in the above refernced file

This function will create a -dbnames query that we'll use to get a list of the available files on the server. Files will need to have at least one account with XML extended privileges to show up here. This query is slower than the rest.

**Example**

```javascript
//Get the list of file names on the specified or host server
var query = fmxj.fileNamesURL();
```

**...returns:**

-dbnames

...which can now be passed to *postQueryFMS()*.

***
**layoutNamesURL(fileName)**

* **fileName:** string: The target FileMaker file

This function will create a -layoutnames query that we'll use to get a list of layout names for the specified file.

**Example**

```javascript
//Get the list of fields and their types on the "Evemts" layout
//build query from our recid, our file and layout name are "Events"
var query = fmxj.LayoutNamesURL("Events");
```

**...returns:**

-db=Events&-layoutnames

...which can now be passed to *postQueryFMS()*.

***
**layoutFieldsURL(fileName, layoutName)**

* **fileName:** string: The target FileMaker file
* **layoutName:** string: The target FileMaker layout in the above refernced file

This function will create a -findany query that we'll use to get a one record result, but just return the layout fields and their data types. We use -findany, because FMPXMLLAYOUT does not give us the actual field types, but just the field control style on the layout. The postQueryFMS() recognizes the -findany and uses that as a flag to return the fields/types instead of actual data.

**Example**

```javascript
//Get the list of fields and their types on the "Evemts" layout
//build query from our recid, our file and layout name are "Events"
var query = fmxj.LayoutFieldsURL("Events" , "Events");
```

**...returns:**

-db=Events&-lay=Events&-findany

...which can now be passed to *postQueryFMS()*.


***
##Functions for working with JavaScript Objects
Functions for handling your objects in JavaScript. One of the ideas of fmxj is to have the FileMaker server do as little work as possible. We want to get our data with small Ajax calls and any kind of necessary scripting in JavaScript. 

*We do have a php deployment option, but the php page is set up to do as little as possible.  It takes our POST then relays it via cURL to the FileMaker Server. It then returns the raw FMPXMLRESULT for fmxj to convert to objects.  We don't anticipate needing to (or wanting to) enhance this server side processing.  Script running arguments were intentionally left off the findRecordsURL() function for the same reason. We weren't even sure about including the sort argument and supporting Portals as nested arrays, but they are in there now.*

These functions are for that client side processing, and we anticipate (hope) that this is the part library that grows!

***
**filterObjects(filters, searchTypes, source)**

* **filters:** array of objects: each object represents a "FileMaker" type requests
* **searchTypes:** object: specifies the search type to perform on the specified property. Supported types are:
  * contains
  * startswith
  * equals
* **source:** array of objects: objects to be filtered

This function creates a new array of objects from a source array based on filters. Each **filters** object represents a FileMaker type find request where each set of name value pairs within the object are *AND* clauses and each object represents an *OR* clause. **searchTypes** alloes you to choose from one of the pre-configured regex searches set up in the function.  You can add your own types by adding them to the **generatRegEx()** function that lives inside **filteObjects.**

``` javascript
//regExp logic is here: for string, use "begins with" by default.
var generateRegEx = function ( v , dt ) {
	var re = new RegExp();
	if (dt.toUpperCase() === "STARTSWITH") { 
		re = new RegExp ( "^" + v + "|\\s" + v , "mi" ) ;
	}
	else if (dt.toUpperCase() === "EQUALS") { 
		re = new RegExp ( "^" + v + "$" ) ;
	}
	else if (dt.toUpperCase() === "CONTAINS") { 
		re = new RegExp ( "\\" + v + "\\" , "mi" ) ;
	};
return re;
};
```
**Example**

``` javascript
var requests = [
					{ "id" : "E4B04F12-E006-4928-A1E0-0E86EDF5641C" } ,
					{ "id" : "463BBEA9-404B-4979-8CC0-6F8F60EB0154" } ,
					{ "id" : "8CDA64C4-643D-4A64-9336-83BEF07F0CF4" } ,
			   ] ;
var types = { "id" : "equals" , "Status" : "equals" } ;
fmxj.filterObjects( requests , types , source ) ;
```

***
**sortObjects(sortOrder, source)**

* **sortOrder:** object: specifies the properties to sort, their sort order and data types.
supported values for order are ascend and descend. Supported types are:
  * string (default, if not specified)
  * number
  * date (use for timestamps too)
  * time (of day)
* **source:** array of objects: objects to be sorted

This function sorts the specified array of objects by 1-n properties, specifying the data type for the property.

**Example**

``` javascript
var sort = 	{ 
				"field1" : "Resource" ,
				"order1" : "ascend" ,
				"type1" : "string" ,
				"field2" : "DateStart" ,
				"order2" : "descend" ,
				"type2" : "date"
		 	} ;
fmxj.sortObjects(sort, dataTypes, source) ;
```

***

**nestObjects(parentArray, childArray, childName, predicates)**

* **parentArray:** array of object: An Array of Objects that will be the parent objects and have the child array nested in them.
* **childArray:** array of objects: An Array of Objects to be nested into the above parent objects.
* **childArray:** string: The name of the property of the child array in the parent object.
* **predicates:** object: An object specifying the match keys to join parent and child objects. Only equijoin matches supported.
  * parentKey1 - parentKeyn: match key properties in the parent objects.
  * childKey1 - childKeyn: match key properties in the child objects.

Nest one array of objects into another as a property a SQL like Join.

**Example**

``` javascript
fmxj.nestObjects(contacts, contactinfo, "ContactInfo", {"parentKey1": "id", "childKey1": "id_Contact"});
```

***







