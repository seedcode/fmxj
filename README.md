#fmxj.js
##A Javascript approach to FileMaker Custom Web Publishing

###With fmxj.js and simple JavaScript Objects you can

* Build complex queries and POST them to FileMaker Server
* Return FileMaker parent and child records as JavaScript Objects/JSON
* Create, edit and delete FileMaker records
* Filter and sort Javascript objects locally with complex criteria.

fmxj.js is designed to do the data interchange work with FileMaker Server in JavaScript. Query strings are created from JavaScript Objects and then POSTED to FileMaker's XML Web Publishing Engine. An XML FMPXMLRESULT is returned and converted into JavaScript Objects/JSON by fmxj. POSTS can be done directly to the FileMaker Server's XML WPE or a simple PHP relay can be used to get around cross-domain issues and provide more authentication options.  See more on the PHP relay below in the **postQueryFMS()** function.

Working examples and basic function descriptions are available at the <a href="http://www.seedcode.com/fmxj/fmxj.html" target="_blank">fmxj example page</a>.

##Functions for working with FileMaker Server
**postQueryFMS ( query, callBackOnReady [, callBackOnDownload, phpRelay] )**

* **query:** string: The query, built by one of the fmxj URL functions
* **callBackOnReady:** function: The handler function for the returned array of objects.
* **callBackOnDownload:** (optional) function: The handler function for the returned array of objects.
* **phpRelay:** (optional) object: specifies the server address and name of the php relay file being used.

The **postQueryFMS** is the primary function used for POSTing query to FileMaker Server via httpXMLRequest and then converting the FMPXMLRESULT xml results into JavaScript objects for callback.  Queries can be created easily from JavaScript objects using the  fmxj URL functions below.  

An optional handler function can be passed as well to report the download progress from FileMaker Server.  Note that FileMaker server does not pass the *e.total* property in it's progres reporting, only the bytes downloded *e.loaded*.

**Example of formatted results (stringified JSON) returned by the postQueryFMS function:**

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
    },
    {
        "-recid": "6202",
        "-modid": "4",
        "DateEnd": "02/13/2014",
        "DateStart": "02/13/2014",
        "Description": "",
        "id": "729C0926-6CBB-46AF-913D-67AE489056FA",
        "id_contact": "E7CA4DFA-2AFA-4756-80E0-C0E157A6E876",
        "id_Phase": "",
        "id_Project": "P00031",
        "Resource": "Example E",
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


**Deployment and the phpRelay**

You can use fmxj without any PHP providing all the JavaScript is hosted on the FileMaker Server.  In this case, the JavaScript will do the httpXMLRequest POST directly to FileMaker Server's XML API.  If the Guest account is not enabled then you will be prompted for FileMaker authentication from the browser.  This is simple **Basic Authentication**, so may not be suitable for your deployment.  If you're using this deployment, you can simply not pass the optional **phpRelay** argument or pass **null** to it.

You will need to use the php Relay if your web server and Filemaker server are located remotely.  FileMaker server does not allow cross domain httpXMLRequests directly to the XML API, and there's no easy way to configure this.  You can do your POST to a PHP page because it's possible to hardcode the PHP headers to allow this kind of cross domain activity.  fmxj comes with a simple PHP file that you can use for this.  You'll then do your POST to the PHP file which will then do the identical POST locally to the FileMaker server and return then relay the XML back.  When doing this you'll need to have the fmxjRelay.php file in your FileMaker WPE's root directory.  You'll then need to define an object in JavaScript and pass it as the phpRelay argument.

**Supported Object Properties Are:**

* php: the php file name (required)
* server: the filemaker server address (optional, you may use the php file with the JS running locally)
* protocol: http / https (optional)
* port: 80/443 (optional)
* user: FileMaker Account Name
* pass: FileMaker Account Password

User name and password can be passed as part of the object.  They are sent via POST, so can be potentially be secured if both the web server and Filemaker Server have SSL certs, otherwise passing the credentials like this is equivalent to **Basic Authentication**.  You also have the option of hardcoding the FileMaker credentials in the PHP file so they're not passed via JavaScript at all.  Providing your users are logging into the Web Server in a secure way, this might be an acceptable approach.

**Examples**

```javascript
//create two objects in a JSON array, each one is a FileMaker Find Request
var requests = [{"Resources":"Example A"},{"Resources":"Example B"}];

//build query from our array
var query = fmxj.findRecordsURL ( "Events" , "Events" , requests ); 

//specify FileMaker Server we're posting to
var relay = {"php":"fmxjRelay.php","server":"seedcode.com"};  

//now do the POST (without any on Download handler);
fmxj.postQueryFMS ( query , onReadyFunction , null , relay );
```

POSTING FileMaker credentials to a secure server would use an object like this:

```javascript
//specify FileMaker https Server we're posting to with credentials
var relay = {"php":"fmxjRelay.php","server":"seedcode.com","protocol":"https","port":"443","user":varUser,"pass":varPass};
```

**Remember!**  Both the Web Server and the FileMaker Server need to be runnning SSL for this transaction to be secure.  There's a good article on this [here](http://www.troyhunt.com/2013/05/your-login-form-posts-to-https-but-you.html).

##Query Building Functions
***

These three functions are used to build the specific query type strings for the **postQueryFMS** function to POST.  The idea being that you can use existing objects or simple JSON to create complex query strings.

***
**findRecordsURL ( fileName, layoutName, requests [, sort, max, skip] )**

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
var sort = {"field1":"DateStart","sort1":"ascend","field2":"Resource","sort2":"descend"};

//build query from our array, our file and layout name are "Events"
var query = fmxj.findRecordsURL ( "Events" , "Events" , requests , sort );
```

**Returns:**

-db=Events&-lay=Events&-query=(q1);(q3)&-q1=Resources&-q1.value=Example A&-q2=Resources&-q2.value=Example B&-sortfield.1=Resources&-sortorder.1=ascend&-findquery

...which can now be passed to **postQueryFMS**.

To specify a request as an **Omit** request, simply specify an -omit property in the object as 1, e.g.

```javascript
var requests = [{"Resources":"Example A","-omit":"1"}];
```

Will generate a query for omiting all the records where the Resource is equal to Example A.

##  

**editRecordURL ( fileName, layoutName, editObj )**

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
var query = fmxj.editRecordURL ( "Events" , "Events" , edit );
```

**Returns:**

-db=Events&-lay=Events&-recid=6198&Resources=Example A&-edit

**-new Example**

```javascript
//Create a new record with Resources set to Example A and StartDate = to 1/11/2015
var newRecord = {"Resources":"Example A","StartDate":"1/11/2015"};

//build query from our object, our file and layout name are "Events"
var query = fmxj.editRecordURL ( "Events" , "Events" , newRecord );    
```

**Returns:**

-db=Events&-lay=Events&Resources=Example A&StartDate=1/11/2015&-new

...these queries can now be passed to **postQueryFMS**.

##  

**deleteRecordURL ( fileName, layoutName, recid )**

* **fileName:** string: The target FileMaker file
* **layoutName:** string: The target FileMaker layout in the above refernced file
* **recid:** number: The -recid / Record ID of the record to delete

This function will create a -delete query for a FileMaker record with the specified -recid property.

**-delete Example**

```javascript
//Delete the record with a -recid of 6198.
//build query from our recid, our file and layout name are "Events"
var query = fmxj.deleteRecordURL ( "Events" , "Events" , 6198 );
```

**Returns:**

-db=Events&-lay=Events&-recid=6198&-delete

...which can now be passed to **postQueryFMS**.

###Functions for working with JavaScript Objects
***

***Coming Soon!***





