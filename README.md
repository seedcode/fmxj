#fmxj.js
##A Javascript approach to FileMaker Custom Web Publishing

###With fmxj.js and simple JavaScript Objects you can

* Build complex queries and POST them to FileMaker Server
* Return FileMaker parent and child records as JavaScript Objects/JSON
* Create, edit and delete FileMaker records
* Filter and sort Javascript objects locally with complex criteria.

fmxj.js is designed to do the data interchange work with FileMaker Server in JavaScript. Query strings are created from JavaScript Objects and then POSTED to FileMaker's XML Web Publishing Engine. An XML FMPXMLRESULT is returned and converted into JavaScript Objects/JSON by fmxj. POSTS can be done directly to the FileMaker Server's XML WPE or a simple PHP relay can be used to get around cross-domain issues and provide more authentication options.  See more on the PHP relay below in the **postQueryFMS()** function.

Working examples and basic function descriptions are available at the <a href="http://www.seedcode.com/fmxj/fmxj.html" target="_blank">fmxj example page</a>.

###postQueryFMS ( query, callBackOnReady [, callBackOnDownload, phpRelay] )

* **query:** string: The query, built by one of the fmxj URL functions
* **callBackOnReady:** function: The handler function for the returned array of objects.
* **callBackOnDownload:** (optional) function: The handler function for the returned array of objects.
* **phpRelay:** (optional) object: specifies the server address and name of the php relay file being used.

The **postQueryFMS** is the primary function used for POSTing query to FileMaker Server via httpXMLRequest and then converting the FMPXMLRESULT xml results into JavaScript objects for callback.  Queries can be created easily from JavaScript objects using the  fmxj URL functions below.  

An optional handler function can be passed as well to report the download progress from FileMaker Server.  Note that FileMaker server does not pass the *e.total* property in it's progres reporting, only the bytes downloded *e.loaded*.

**Deployment and the phpRelay**

You can use fmxj without any PHP providing all the JavaScript is hosted on the FileMaker Server.  In this case, the JavaScript will do the httpXMLRequest POST directly to FileMaker Server's XML API.  If the Guest account is not enabled then you will be prompted for FileMaker authentication from the browser.  This is simple **Basic Authentication**, so may not be suitable for your deployment.  If you're using this deployment, you can simply not pass the optional **phpRelay** argument or pass **null** to it.

You will need to use the php Relay if your web server and Filemaker server are located remotely.  FileMaker server does not allow cross domain httpXMLRequests directly to the XML API, and there's no easy way to configure this.  You can do your POST to a PHP page because it's possible to hardcode the PHP headers to allow this kind of cross domain activity.  fmxj comes with a simple PHP file that you can use for this.  You'll then do your POST to the PHP file which will then do the identical POST locally to the FileMaker server and return then relay the XML back.  When doing this you'll need to have the fmxjRelay.php file in your FileMaker WPE's root directory.  You'll then need to define an object in JavaScript and pass it as the phpRelay argument.

Supported Object Properties Are:

* php: the php file name (required)
* server: the filemaker server address (optional, you may use the php file with the JS running locally)
* protocol: http / https (optional)
* port: 80/443 (optional)
* user: FileMaker Account Name
* pass: FileMaker Account Password

User name and password can be passed as part of the object.  They are sent via POST, so can be potentially be secured if both the web server and Filemaker Server have SSL certs, otherwise passing the credentials like this is equivalent to **Basic Authentication**.  You also have the option of hardcoding the FileMaker credentials in the PHP file so they're not passed via JavaScript at all.  Providing your users are logging into the Web Server in a secure way, this might be an acceptable approach.

###Example

1. `//create two objects in a JSON array, each one is a FileMaker Find Request.`
2. `var requests = [{"Resources":"Example A"},{"Resources":"Example B"}];`
3. `//build query from our array`
4. `var query = fmxj.findRecordsURL ( "Events" , "Events" , requests );`
5. `//specify FileMaker Server we're posting to`
6. `var relay = {"php":"fmxjRelay.php","server":"seedcode.com"};`
7. `//and do the POST (without any on Download handler);`
8. `fmxj.postQueryFMS ( query , onReadyFunction , null , relay );`

###Query building functions

These functions are used to build the specific query type strings for the **postQueryFMS** function to POST.






