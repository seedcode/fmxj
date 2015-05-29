//fmxj.js a Javascript Object Based approach to FileMaker Custom Web Publishing

 /*
 
LICENSE
 
(The MIT License)

Copyright (c) 2015 SeedCode SeedCode.Com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


var fmxj = ( function () {
'use strict'
return {
	
	postQueryFMS: postQueryFMS ,
	convertXml2js: convertXml2Js,
	findRecordsURL: findRecordsURL,
	editRecordURL: editRecordURL,
	deleteRecordURL: deleteRecordURL,
	fileNamesURL: fileNamesURL,
	layoutNamesURL: layoutNamesURL,
	layoutFieldsURL: layoutFieldsURL,
	errorDescription: errorDescription,
	filterObjects: filterObjects,
	sortObjects: sortObjects,
	nestObjects: nestObjects,
}

//**********FileMaker Server Functions






//function does an httpXMLRequest to the server and returns the results in JSON
//Optional PHP Proxy/Relay information can be passed via the phpRelay object.
//user and pass are provided if you're running your own client side auth routine. (Sent via POST).
//var phpRelay = {"php":"fmxj.php","server":"192.168.1.123","protocol":"http","port":80,"user":"Admin","pass":"1234"};
//resultClass is object for defining result objects, specify new properties and map the source values.
//max will paginate results and recursively return pages to the callBack until all results have been returned.
function postQueryFMS( query , callBackOnReady , callBackOnDownload , phpRelay , resultClass , max , nestPortals ) {
	
	//if you want nesting related records on or off by default, on for this build
	if(nestPortals==null){
		nestPortals=false;
	};
	
	//check what query type we are as we'll do custom results for some (delete findany)	
	//check if we're a delete request as we handle error captryre differently, i.e. return ERRORCODE:0.
	var li = query.lastIndexOf("-");
	var parm = query.substring(li,query.length);
	if (parm!=="-delete"&&parm!=="-findany"){
		parm = null;
	};
	
	function internalCallBack(js,utc){
		var c = js.length;
		if(c===max){//our page is full, so increment skip and send back
			skip = skip + max;
			query = updateParam(query,"-skip",skip);
			// Make New Request
			req();
		};
		callBackOnReady(js,utc);
	};
	
	function req(){
	
	//define request.
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
	{
		var utc = new Date().getTime();
	    var js = convertXml2Js(xmlhttp.responseXML,parm,resultClass,nestPortals);
		xmlhttp = null;
		if ( js ) { internalCallBack ( js , utc ) } ;
	}
	};
	if(callBackOnDownload){
		xmlhttp.onprogress = function(e){
			//e.loaded is the only feedback we get from FMS, but still may be useful.
			callBackOnDownload(e.loaded);
		}
	};
	xmlhttp.open( "POST",  url , true ) ;
	xmlhttp.send(query);
	
	};
	
	//function for upgating max and skip in query
	if (max){
		//does the query argument already have a max?
		var m = query.indexOf("-max=");
		if(m==true){
			query = updateParam(query,"-max",max) //if there's a max parm specified already, we override it.
		}
		else{
			query = query.substring(0,li) + "-max=" + max + "&" + query.substring(li,query.length);
		};
		//does the query argument already have a skip?
		var s = query.indexOf("-skip=");
		if(s==true){
			var se = query.indexOf("&",s);
			var skip = query.substring(s+5,se);
		}
		else{
			li = query.lastIndexOf("-");
			var skip = 0;
			query = query.substring(0,li) + "-skip=" + skip + "&" + query.substring(li,query.length);
		};
	};
	

	
	
	//if a proxy object is specified, then we'll send our POST to fmxjRelay.PHP page, so update query value.  
	//Otherwise we're posting locally right to FMS via XML.
	if(phpRelay){
		
		//default to http if not specified
		if (phpRelay["protocol"])
			{var proxy = phpRelay["protocol"]} 
		else {var proxy = "http"};
		
		//define FMS server location if specified
		var server = "";
		if (phpRelay["server"])
			{server = proxy + "://" + phpRelay["server"]}
		else {server = ""};
		
		//append port if specified
		if (phpRelay["port"] && server!==""){
			server += ":" + phpRelay["port"] + "/";
			}
		else if (server==="") {
			server = "/";
		}
		else {
			server += "/";
		}
		;
		
		var php = phpRelay["php"];
		
		// if you're running your own authentication routine you can send via POST and the PHP page will use to auth to FMS.
		var user = phpRelay["user"];
		var pass = phpRelay["pass"];
		
		//define target and POST payload
		var url = server + php  ;
		var creds = "&u=" + user + "&p=" + pass;
		var lengthParamStr = "&l=";
		var cl = creds.length;
		var cl = cl.toString().length + lengthParamStr.length + cl;
		query += creds + lengthParamStr + cl;
		
	}
	//going right to FMS via XML locally.
	else{
		url = "/fmi/xml/FMPXMLRESULT.xml";
	};
	
	req();
	
};

//parses a FMPXMLRESULT into JSON adding -recid and -modid properties.
//FMPXMLRESULT is 50-60% the size of fmresultset, so that's what we're using.
//function for converting xml onready in queryFMS but could have uses outside of there, so leaving Public
function convertXml2Js( xml , requestType , resultClass , portal ){
		
		//rather than parsing errors.
		if(!xml){return
			[{"ERRORCODE" : "-1","DESCRIPTION" : "No XML Results from the FileMaker Server"}]
		};
		
		var c = 0;
		var v = 0;
		var dataTag = "DATA";
		var colTag = "COL";
		var resultTag = "RESULTSET" ;
		var errorCodeTag = "ERRORCODE" ;
		var description = "DESCRIPTION"
		var metadataTag = "METADATA" ;
		var dataBaseTag = "DATABASE" ;
		var dateFormatTag = "DATEFORMAT" ;
		var timeFormatTag = "TIMEFORMAT" ;
		var recordTag = "ROW" ;
		var foundTag = "FOUND";
		var recid = "RECORDID";
		var modid = "MODID";
		var id = "";
		var mid = "";
		var row = "";
		var result = [];
		var obj = {};
		var newArray = [];
		
		//function for generating layout/field info from the METADATA Node
		//returns an object with two objects and an array: 
		//model{}: fieldnames reference index position 
		//fields{}: fieldnames reference data type
		//index[]: fieldnames (no TO:: pre-fix) in their index position
		function layoutModel ( FMXMLMetaData ){
			
			var index = [];
			var result = {}
			var fields = {};		
			var model = {};
			var nameTag = "NAME";
			var typeTag = "TYPE";
			var field = "";
			var type = "";
			var fieldCount = FMXMLMetaData.childNodes.length ;
			var i = 0;
			
			while(i<fieldCount){
				field = FMXMLMetaData.childNodes[i].getAttribute(nameTag);
				type = FMXMLMetaData.childNodes[i].getAttribute(typeTag);
				//related field
				if(field.indexOf("::")>0 && portal===true){
					var pos = field.indexOf("::");
					var t = field.substring(0,pos);
					var f = field.substring(pos+2);
					t = "-" + t; //add hyphen prefix to keep from coliding with parent fields
					//does this proprty t exist in our model
					if(!model[t]){model[t]=[]};
					model[t].push(i);
					index[i]=f;					
				}
				//local field
				else
				{
					model[field] = [i];
					index[i]=field;
				}
				fields[field]=type;
			i++;
			};
			result["model"]=model;
			result["fields"]=fields;
			result["index"]=index;
			return result;
		};
		
		//retrieve value from the current XML DATA node by field name
		//returns an array as there can be 1...n values
		function valueByField(field){
			//can return a string or an array.
			if(field==="-recid"){return id};
			if(field==="-modid"){return mid};
			var a = fieldObjects["model"][field];
			if(a.length>1&&field.indexOf("-")===0){ //fields in a portal
				var i = 0;
				var result = [];
				for (i in a){
					result.push(valueByIndex(a[i]))
				};
				return result;
			}
			else{	
				return valueByIndex(a[0]);
			}
		};
		
		//retrieve value from the current XML DATA node by field name
		//returns a string if there is just one value.
		function valueByFieldString(field){
			//can return a string or an array.
			if(field==="-recid"){return id};
			if(field==="-modid"){return mid};
			var a = fieldObjects["model"][field];
			if(a.length>1){ //fields in a portal
				var i = 0;
				var result = [];
				for (i in a){
					result.push(valueByIndex(a[i]))
				};
				return result;
			}
			else{	
				return valueByIndex(a[0])[0];
			}
		};
		
		//retrieve value from the current XML DATA node by field index
		function valueByIndex(i){
			//Just get the values by index
			//return as an array as we may have multiples.
			var column = row.getElementsByTagName(colTag)[i];
			if(!column){
				return ""
			}
			var children = column.childNodes.length;
			//override the count if portal is set to false so we just get the first value
			if(!portal){children=1};
			var c = 0;
			var data = "";
			var val = "";
			var result = [];
			while (c<children){
				data = column.getElementsByTagName(dataTag)[c].childNodes[0];
				if(data){val=data.nodeValue} else {val=""};
				result.push(val);
			c++;
			};
			return result;
		};
		
		//turns arrays/columns into javascript objects. arrays come from layout portals
		//index is an array of field names to use for the nested object prop names
		//arrays is an array of the arrays of valuesreturned valuesByField
		function arraysToObjects(index, arrays){
			var result = [];
			var aLgth = arrays[0].length;
			if(aLgth===0){
				return "";
			}
			var iLgth = index.length;
			var i = 0;
			var a = 0;
			while (a<aLgth){
				result[a]={};
				for (i in index){
					result[a][index[i]] = arrays[i][a];
				}
				a++;
			};	
			return result;
		};
		
		//creates the new Objects for results.
		//custom is an object that maps our FileMaker fields to a new object.
		//see demo page postQueryFMS() example 5 for custom example
		function newObject(custom){
			var thisObject = {};
			var c = 0;
			var i = 0;
			var val = "";

			if(custom){
				var props = Object.getOwnPropertyNames(custom);
				for (c in props){
					thisObject[props[c]] = custom[props[c]]["getValue"](valueByFieldString);
				};
			}
			else {
				thisObject["-recid"]=id;
				thisObject["-modid"]=mid;
				var arrays = [];
				var index = [];
				var fields = [];
				var props = Object.getOwnPropertyNames(fieldObjects["model"]);
				for (c in props){
					val = valueByField(props[c]);
					if (val.length===1&&props[c].indexOf("-")!==0){
						thisObject[props[c]] = val[0];
					}
					else{
						index = fieldObjects["model"][props[c]]; //index of fields from the model
						for (i in index){  //get the field name from the index array
							fields.push(fieldObjects["index"][index[i]]); //fieldnames
							arrays.push(val[i]); //array of arrays
						};
							thisObject[props[c]] = arraysToObjects(fields, arrays);
					};
				};
			};
			return thisObject;
		};
		
		//define layout model
		var mData = xml.getElementsByTagName(metadataTag)[0];
		var fieldObjects = layoutModel(mData);
		
		//we handle the results format a little differently for these queries so flag them,
		var isDeleteRequest = false;
		if (requestType==="-delete"){
			var isDeleteRequest = true;
		};
		var isFindAnyRequest = false;
		if (requestType==="-findany"){
			var isFindAnyRequest = true;
		};
			
		//error check return error code object if not 0 OR delete request.
		var error = xml.getElementsByTagName(errorCodeTag)[0].childNodes[0].nodeValue;
		
		if ( error!=0 || isDeleteRequest ) {
			// exit with errcode object
			var desc = errorDescription(error);
			var errorObject = {};
			var errorJs = [];
			errorObject[errorCodeTag] = error ;
			errorObject[description] = desc ;
			errorJs[0] = errorObject ;
			return errorJs;
		}
		
		//altrnate formatting depending on request
		if(isFindAnyRequest){// return as object with two contained objects {model,result}
			var dateFormat = id = xml.getElementsByTagName(dataBaseTag)[0].getAttribute(dateFormatTag);
			var timeFormat = id = xml.getElementsByTagName(dataBaseTag)[0].getAttribute(timeFormatTag);
			
			result = [
				{
					"DATEFORMAT":dateFormat,
					"TIMEFORMAT":timeFormat,
	
					"FIELDS":fieldObjects.fields,
				}
			];
			return result;
		}
		else{
			//cycle through XML records and create objects accordingly.
			var numResults = xml.getElementsByTagName(resultTag)[0].childNodes.length;
			while ( c < numResults ) {
				row = xml.getElementsByTagName(recordTag)[c];
				id = xml.getElementsByTagName(recordTag)[c].getAttribute(recid);
				mid = xml.getElementsByTagName(recordTag)[c].getAttribute(modid);
				result.push(newObject(resultClass));
				c++;	
			};
			return result;
		};

};

//creates a general -findquery URL for postQueryFMS
//each object represtents a find request
//add -omit:1 to the object to make omit request
function findRecordsURL( fileName , layoutName , requests , sort , max , skip ){
	
	//function for building sort string, trturns "" if sort not specified.
	var addSortURL =  function ( sortObject ){
		if (!sortObject){return ""};
		var fields = Object.keys(sortObject);
		var f = 0;
		var fq = fields.length;
		var i = 0 ;
		var fnp = "";
		var fbo = "";
		var thisField = "";
		var thisOrder = "";
		var txt = "";
		for (f in fields){
			i = Number(f) + Number(1);
			fnp = "field" + i ;
			fbo = "order" + i ;
			thisField = sortObject[fnp];
			thisOrder = sortObject[fbo];
			if (!thisField){
			return txt;
			}
			else {
			if (!thisOrder){thisOrder = "ascend"};
			txt += "&-sortfield." + i + "=" + thisField + "&-sortorder." + i + "=" + thisOrder ;
			};
		};
		return txt;
	};
	
	var srt = addSortURL (sort);
	
	//max and skip
	if(max){
		var mx = "&-max=" + max;
	}
	else
	{var mx = "";
	};
	if(skip){
		var sk = "&-skip=" + skip;
	}
	else
	{var sk = "";
	};


	
	//build simple fild all query if none specified and done.
	if (!requests){ return "-db=" + fileName + "&-lay=" + layoutName + srt + sk + mx + "&-findall" };
	var c = 0 ;
	var r = 0 ;
	var ff = 0 ;
	var thisRequest = {};
	var requestFields = [];
	var qa = "" ;
	var qan = "" ;
	var thisField = "";
	var thisValue = "";
	var omitProp = "-omit"
	//build OR clauses (requests) for each object
	for ( r in requests ){
		thisRequest = requests[r];
		requestFields = Object.keys(thisRequest);
		if (r==0){qan+="&-query=("} else {qan+=";("}
		//build and clases (specfiy fields and criteria) for this object (request).
		for (ff in requestFields){
			thisField = requestFields[ff];
			if(thisField===omitProp){
				//omit this request by inserting ! into qan in front of last (.
				//and don't include this property as a field search.
				var i = qan.lastIndexOf("(");
				qan = qan.substr(0,i)+"!"+qan.substr(i);				
			}
			else {
				//regular request, write as is
			thisValue = thisRequest[thisField];
			c ++ ;
			qa += "&-q"+c+"="+thisField+"&-q"+c+".value="+thisValue ;
			if (ff==0){qan+="q"+c} else {qan+=",q"+c};
			};
		};		

		qan += ")"

	};
	qa += srt + sk + mx + "&-findquery";
	qan += qa
	//return "/fmi/xml/FMPXMLRESULT.xml?-db=" + fileName + "&-lay=" + layoutName + qan ;
	return "-db=" + fileName + "&-lay=" + layoutName + qan ;
};

//returns a general -edit URL for postQueryFMS from an object
//object properties need to correspond to
//leaving the record id property (fmxjRecId) blank indicates a new record
function editRecordURL( fileName , layoutName , editObj ){
	
	var f = 0 ;
	var q = "";
	var recid = "-recid";
	var thisField = "";
	var fieldNames = Object.keys ( editObj ) ;
	var recid = editObj [recid];
	//if we have a record id then we edit the specified record.
	//if no record id is passed, then we create a new record.
	if (!recid)
		{
		var tag = "&-new"
		} 
		else {
		var tag = "&-edit";
		};
	for ( f in fieldNames ){
		thisField = fieldNames[f];
		q += "&" + thisField + "=" + encodeURIComponent(editObj[thisField]);
	};
	q = q + tag ;
	return "-db=" + fileName + "&-lay=" + layoutName + q ;
};

//creates a general -delete URL for postQueryFMS
function deleteRecordURL( fileName , layoutName , recid ){
	var q = "&-recid=" + recid + "&-delete";
	return "-db=" + fileName + "&-lay=" + layoutName + q ;
};

//creates a general -findany URL for postQueryFMS, but we'll just get the metadata
//we use this instead of FMPXMLLAYOUT does not give us field data types!!!???
function layoutFieldsURL( fileName , layoutName ){
	var q = "&-findany"
	return "-db=" + fileName + "&-lay=" + layoutName + q ;
};

//creates a general -layoutnames URL for postQueryFMS, returns the list as an object array
function layoutNamesURL( fileName ){
	var q = "&-layoutnames"
	return "-db=" + fileName  + q ;
};

//creates a general -dbnames URL for postQueryFMS, returns the list as an object array
function fileNamesURL(){
	var q = "-dbnames"
	return  q ;
};

//Descriptions of FileMaker Error Codes
// returns english text for an error
// from Jerimiah Small simpleFM.php - http://www.jsmall.us/downloads/
// via simpleFMProxy Todd Geist <todd@geistinterctive.com>
function errorDescription(code){
	var obj =
	{
	"-2" : "Couldn't connect to the FileMaker Server. Check you user name and password, and check you server configuration", 
	"-1" : "Unknown error",
	0 : "No error", 
	1 : "User canceled action", 
	2 : "Memory error", 
	3 : "Command is unavailable (for example, wrong operating system, wrong mode, etc.)", 
	4 : "Command is unknown", 
	5 : "Command is invalid (for example, a Set Field script step does not have a calculation specified)", 
	6 : "File is read-only", 
	7 : "Running out of memory", 
	8 : "Empty result", 
	9 : "Insufficient privileges", 
	10 : "Requested data is missing", 
	11 : "Name is not valid", 
	12 : "Name already exists", 
	13 : "File or object is in use", 
	14 : "Out of range", 
	15 : "Can't divide by zero", 
	16 : "Operation failed, request retry (for example, a user query)", 
	17 : "Attempt to convert foreign character set to UTF-16 failed", 
	18 : "Client must provide account information to proceed", 
	19 : "String contains characters other than A-Z, a-z, 0-9 (ASCII)", 
	100 : "File is missing", 
	101 : "Record is missing", 
	102 : "Field is missing", 
	103 : "Relationship is missing", 
	104 : "Script is missing", 
	105 : "Layout is missing", 
	106 : "Table is missing", 
	107 : "Index is missing", 
	108 : "Value list is missing", 
	109 : "Privilege set is missing", 
	110 : "Related tables are missing", 
	111 : "Field repetition is invalid", 
	112 : "Window is missing", 
	113 : "Function is missing", 
	114 : "File reference is missing", 
	130 : "Files are damaged or missing and must be reinstalled", 
	131 : "Language pack files are missing (such as template files)", 
	200 : "Record access is denied", 
	201 : "Field cannot be modified", 
	202 : "Field access is denied", 
	203 : "No records in file to print, or password doesn't allow print access", 
	204 : "No access to field(s) in sort order", 
	205 : "User does not have access privileges to create new records; import will overwrite existing data", 
	206 : "User does not have password change privileges, or file is not modifiable", 
	207 : "User does not have sufficient privileges to change database schema, or file is not modifiable", 
	208 : "Password does not contain enough characters", 
	209 : "New password must be different from existing one", 
	210 : "User account is inactive", 
	211 : "Password has expired", 
	212 : "Invalid user account and/or password. Please try again", 
	213 : "User account and/or password does not exist", 
	214 : "Too many login attempts", 
	215 : "Administrator privileges cannot be duplicated", 
	216 : "Guest account cannot be duplicated", 
	217 : "User does not have sufficient privileges to modify administrator account", 
	300 : "File is locked or in use", 
	301 : "Record is in use by another user", 
	302 : "Table is in use by another user", 
	303 : "Database schema is in use by another user", 
	304 : "Layout is in use by another user", 
	306 : "Record modification ID does not match", 
	400 : "Find criteria are empty", 
	401 : "No records match the request", 
	402 : "Selected field is not a match field for a lookup", 
	403 : "Exceeding maximum record limit for trial version of FileMaker Pro", 
	404 : "Sort order is invalid", 
	405 : "Number of records specified exceeds number of records that can be omitted", 
	406 : "Replace/Reserialize criteria are invalid", 
	407 : "One or both match fields are missing (invalid relationship)", 
	408 : "Specified field has inappropriate data type for this operation", 
	409 : "Import order is invalid", 
	410 : "Export order is invalid", 
	412 : "Wrong version of FileMaker Pro used to recover file", 
	413 : "Specified field has inappropriate field type", 
	414 : "Layout cannot display the result", 
	500 : "Date value does not meet validation entry options", 
	501 : "Time value does not meet validation entry options", 
	502 : "Number value does not meet validation entry options", 
	503 : "Value in field is not within the range specified in validation entry options", 
	504 : "Value in field is not unique as required in validation entry options", 
	505 : "Value in field is not an existing value in the database file as required in validation entry options", 
	506 : "Value in field is not listed on the value list specified in validation entry option", 
	507 : "Value in field failed calculation test of validation entry option", 
	508 : "Invalid value entered in Find mode", 
	509 : "Field requires a valid value", 
	510 : "Related value is empty or unavailable", 
	511 : "Value in field exceeds maximum number of allowed characters", 
	600 : "Print error has occurred", 
	601 : "Combined header and footer exceed one page", 
	602 : "Body doesn't fit on a page for current column setup", 
	603 : "Print connection lost", 
	700 : "File is of the wrong file type for import", 
	706 : "EPSF file has no preview image", 
	707 : "Graphic translator cannot be found", 
	708 : "Can't import the file or need color monitor support to import file", 
	709 : "QuickTime movie import failed", 
	710 : "Unable to update QuickTime file reference because the database file is read-only", 
	711 : "Import translator cannot be found", 
	714 : "Password privileges do not allow the operation", 
	715 : "Specified Excel worksheet or named range is missing", 
	716 : "A SQL query using DELETE, INSERT, or UPDATE is not allowed for ODBC import", 
	717 : "There is not enough XML/XSL information to proceed with the import or export", 
	718 : "Error in parsing XML file (from Xerces)", 
	719 : "Error in transforming XML using XSL (from Xalan)", 
	720 : "Error when exporting; intended format does not support repeating fields", 
	721 : "Unknown error occurred in the parser or the transformer", 
	722 : "Cannot import data into a file that has no fields", 
	723 : "You do not have permission to add records to or modify records in the target table", 
	724 : "You do not have permission to add records to the target table", 
	725 : "You do not have permission to modify records in the target table", 
	726 : "There are more records in the import file than in the target table. Not all records were imported", 
	727 : "There are more records in the target table than in the import file. Not all records were updated", 
	729 : "Errors occurred during import. Records could not be imported", 
	730 : "Unsupported Excel version. (Convert file to Excel 7.0 (Excel 95), Excel 97, 2000, or XP format and try again)", 
	731 : "The file you are importing from contains no data", 
	732 : "This file cannot be inserted because it contains other files", 
	733 : "A table cannot be imported into itself", 
	734 : "This file type cannot be displayed as a picture", 
	735 : "This file type cannot be displayed as a picture. It will be inserted and displayed as a file", 
	800 : "Unable to create file on disk", 
	801 : "Unable to create temporary file on System disk", 
	802 : "Unable to open file", 
	803 : "File is single user or host cannot be found", 
	804 : "File cannot be opened as read-only in its current state", 
	805 : "File is damaged; use Recover command", 
	806 : "File cannot be opened with this version of FileMaker Pro", 
	807 : "File is not a FileMaker Pro file or is severely damaged", 
	808 : "Cannot open file because access privileges are damaged", 
	809 : "Disk/volume is full", 
	810 : "Disk/volume is locked", 
	811 : "Temporary file cannot be opened as FileMaker Pro file", 
	813 : "Record Synchronization error on network", 
	814 : "File(s) cannot be opened because maximum number is open", 
	815 : "Couldn't open lookup file", 
	816 : "Unable to convert file", 
	817 : "Unable to open file because it does not belong to this solution", 
	819 : "Cannot save a local copy of a remote file", 
	820 : "File is in the process of being closed", 
	821 : "Host forced a disconnect", 
	822 : "FMI files not found; reinstall missing files", 
	823 : "Cannot set file to single-user, guests are connected", 
	824 : "File is damaged or not a FileMaker file", 
	900 : "General spelling engine error", 
	901 : "Main spelling dictionary not installed", 
	902 : "Could not launch the Help system", 
	903 : "Command cannot be used in a shared file", 
	904 : "Command can only be used in a file hosted under FileMaker Server", 
	905 : "No active field selected; command can only be used if there is an active field", 
	920 : "Can't initialize the spelling engine", 
	921 : "User dictionary cannot be loaded for editing", 
	922 : "User dictionary cannot be found", 
	923 : "User dictionary is read-only", 
	951 : "An unexpected error occurred (*)", 
	954 : "Unsupported XML grammar (*)", 
	955 : "No database name (*)", 
	956 : "Maximum number of database sessions exceeded (*)", 
	957 : "Conflicting commands (*)", 
	958 : "Parameter missing (*)", 
	1200 : "Generic calculation error", 
	1201 : "Too few parameters in the function", 
	1202 : "Too many parameters in the function", 
	1203 : "Unexpected end of calculation", 
	1204 : "Number, text constant, field name or \"(\" expected", 
	1205 : "Comment is not terminated with \"*\/\"", 
	1206 : "Text constant must end with a quotation mark", 
	1207 : "Unbalanced parenthesis", 
	1208 : "Operator missing, function not found or \"(\" not expected", 
	1209 : "Name (such as field name or layout name) is missing", 
	1210 : "Plug-in function has already been registered", 
	1211 : "List usage is not allowed in this function", 
	1212 : "An operator (for example, +, -, *) is expected here", 
	1213 : "This variable has already been defined in the Let function", 
	1214 : "AVERAGE, COUNT, EXTEND, GETREPETITION, MAX, MIN, NPV, STDEV, SUM and GETSUMMARY: expression found where a field alone is needed", 
	1215 : "This parameter is an invalid Get function parameter", 
	1216 : "Only Summary fields allowed as first argument in GETSUMMARY", 
	1217 : "Break field is invalid", 
	1218 : "Cannot evaluate the number", 
	1219 : "A field cannot be used in its own formula", 
	1220 : "Field type must be normal or calculated", 
	1221 : "Data type must be number, date, time, or timestamp", 
	1222 : "Calculation cannot be stored", 
	1223 : "The function referred to does not exist", 
	1400 : "ODBC driver initialization failed; make sure the ODBC drivers are properly installed", 
	1401 : "Failed to allocate environment (ODBC)", 
	1402 : "Failed to free environment (ODBC)", 
	1403 : "Failed to disconnect (ODBC)", 
	1404 : "Failed to allocate connection (ODBC)", 
	1405 : "Failed to free connection (ODBC)", 
	1406 : "Failed check for SQL API (ODBC)", 
	1407 : "Failed to allocate statement (ODBC)", 
	1408 : "Extended error (ODBC)"
		
	};
	return obj[code];
};

//**********Javascript Object Array Functions

//Filter an Array of objects by property.
//returns a new object array based on filters
//each "filters" object represents an OR clause containing AND clauses, example:
//[{"Status":"Active","Resource":"Room A"},{"Status":"New","resource":"Room A"}]
//returns all objects where the resource is "Room A" and the status is "Active" or "New".
//specify data types as a single object: {"Status":"String"} unspecified properties will be treated as strings.
function filterObjects( filters , searchTypes , source ) {
	
	//if no filters applied, we can just return the source
	if(!filters){return source};
	
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
	
			var s = 0;
			var f = 0;
			var accept = 0;
			var numFilterFields = 0;
			var ff = 0;
	
			var thisFilterField = "";
			var thisFilterFieldValue = "";
			var thisObjectFieldValue = "";
			var thisFilterFieldType = "";
	
			var newObjectArray = [];
			var filterFields = [] ;
	
			var thisObject = {};
			var thisFilter = {};
	
			var thisRE = new RegExp();
			//loop through objects
			for ( s in source ) {
				thisObject = source[s];
				//loop through filters and test accordingly.
				for ( f in filters ) {
					accept = 0; 
					thisFilter = filters[f];
					filterFields = Object.keys ( thisFilter ) ; 
					numFilterFields = filterFields.length ;
					for ( ff in filterFields ){ 
						thisFilterField = filterFields[ff];
						thisFilterFieldValue = thisFilter[thisFilterField];
						thisObjectFieldValue = thisObject[thisFilterField];
						thisFilterFieldType = searchTypes[thisFilterField];
						if ( !thisFilterFieldType ) { 
							 thisFilterFieldType = "STARTSWITH" 
						 	};
						thisRE = generateRegEx ( thisFilterFieldValue , thisFilterFieldType );
						if ( thisRE.test ( thisObjectFieldValue)) { 
							accept ++ ; 
							};
						}; 
						//add to new object if all filter fields in the filter return true for our regExp
						if ( accept === numFilterFields ) { 
							newObjectArray.push(thisObject); 
							break; 
							} ; 
					}; 

				}; 
	
			return newObjectArray ;
};

//Sort an Array of objects by property.
//the "sortOrder" is a single object specifying properties, order and type
//{"property1":"StartDate","order1":"Ascend","type1":"date","property2":"Resource","order2":"Descend","type2":"string"}
//Supported types: String, Number, Date, Time
function sortObjects( sortOrder,  source ) {

			var convertDateString = function ( ds ) {var d = new Date(ds);return(Number(d));};
			var convertTimeString = function ( ts ) {
				var vals = ts.split(':');
				var v = 0;
				var thisVal = 0;
				var seconds = 0;
				for ( v in vals ){
					thisVal = Number ( vals[v].substr(0,2) );
					seconds += thisVal * Math.pow(60,2-v);
				}
				return seconds;
			};
						
			var scEvalSort = function ( s , t , dType , sOrder ){
						
				if ( dType.toUpperCase() === "STRING" ){
					if ( sOrder.toUpperCase() === "ASCEND" ) { 		
						if ( s < t ) { return -1 } else { return 1 } ;
						} 
					else { 							
						if ( s > t ) { return -1 } else { return 1 } ;
						};
					} 
				else if ( dType.toUpperCase() === "NUMBER" ) {
					if ( sOrder.toUpperCase() === "ASCEND" ) { 	
						 	return s - t }
						else {						
							return t - s } ;
					}
				else {
					return 0
				};
			}; 
	
			//var sortFields = Object.keys ( sortOrder ) ;
		
			source.sort ( function ( a , b ) {
	
				var result = 0;
				var sf = 0;
				var i = 0;
				
				var adp = "";
				var v = "";
				var p = "";
				var t = "";
				var ad = "";
	
		
				for ( sf in sortOrder ) {
					i++
					p = sortOrder["property"+i];
					ad = sortOrder["order"+i];
					t = sortOrder["type"+i];
					
					if (!t){t="STRING"};
							
					if (!a[p]) { var x = "" } else { var x = a[p] } ; 
					if (!b[p]) { var y = "" } else { var y = b[p] }; 

					
					//ignore case
					if ( t.toUpperCase() === "STRING" ) { 
						if ( x.length > 0 ) { var x = x.toUpperCase()} else { var x = "" }  ;
						if ( y.length > 0 ) { var y = y.toUpperCase()} else { var y = "" } ; 
					} ; 
						
					//convert dates to numbers for sort.
					if ( t.toUpperCase() === "DATE" ) {
						if ( x.length > 0 ) { x = convertDateString(x);} else { var x = "" }  ;
						if ( y.length > 0 ) { y = convertDateString(y);} else { var y = "" } ; 
						t = "NUMBER";
					} ;
					
					//convert dates to numbers for sort.
					if ( t.toUpperCase() === "TIME" ) {
						if ( x.length > 0 ) { x = convertTimeString(x);} else { var x = "" }  ;
						if ( y.length > 0 ) { y = convertTimeString(y);} else { var y = "" } ; 
						t = "NUMBER";
					} ;
			
					if ( x !== y ) { 
						result = sf ; 
						break; 
						}; 
					}; 
		
					if ( result === 0 ) { 
						return 0 ;
					}
					else { 
						if ( length.ad === 0 ) ad = "ASCEND"; 
						return scEvalSort ( x , y , t , ad ) ;  
					} ; 
				} 
			);
} ;

//nest one object array (child) into another (parent) using SQL like predicates
//childName will be the property name of the nested array.
//predicates object will look like { "parentKey1" : "contactID", "childKey1" : "contactID" , "operator1" : "=" };
//additonal predicates ban ce assigned as leftKey2, leftKey3, etc.
function nestObjects( parentArray, childArray, childName, predicates) {
	
	function nestTheseObjects(p,c){
		var n = 1;
		var ok = 1;
		
		while ( predicates["parentKey" + n] ) {
			var pv = p[predicates["parentKey" + n]];
			var cv = c[predicates["childKey" + n]];
			if (pv===cv){ok++}
			n++;
		};
		if(n===ok&&n>1){ // all predicates match for this object, so we can nest.
			//does the childName already exist in this Parent?
			//if not, create it.
			if(!p[childName]){
				p[childName]=[]
			};
			p[childName].push(c);
			return true;
		}
	};
	
	console.log(childArray.slice(0,10));
	
	for (var pa in parentArray){
		var cc = [];
		var i = 0;
		var result = [];
		for (var ca in childArray){
			result = nestTheseObjects(parentArray[pa],childArray[ca]);
			if (result){cc.unshift(ca)} //mark this object for removal from child array.
		};
		for (i in cc){
			childArray.splice(cc[i],1); //remove the child records that were nested from the childArray, so next pass a little shorter.
		};
	};
	childArray=null;
};


//**********Private Functions

//updates a parameter value in url query and returns new query string
function updateParam(query, param, value){
	var pl = param.length;
	var ql = query.length;
	var pp = query.lastIndexOf(param);
	if(!pp){return} //can only update existing params
	var pe = query.indexOf("&",pp);
	var q = query.substring( 0, Number(pp) + Number(pl) + 1 ) + value + query.substring(pe,ql);
	return q;
};



}())



