<?php
//simple page for passing xml requests and returning xml results.  
//Requests are created and passed by fmxj javascript functions.
//returned xml is converted to JSON by fmxj function.

//Many thanks to Angelo Luchi for helping with this file!!! angelo@foxtailtech.com

 /*
 
LICENSE
 
(The MIT License)

Copyright (c) 2015 SeedCode SeedCode.Com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
 error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
 ini_set("display_errors" , false );
 
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
header('Content-Type: application/xml');


//constants
//this shouldn't change.  fmxj.convertXml2js() Is Expecting FMPXMLRESULT
//FMPXMLRESULT is typically 50-60% the size of fmresultset.
$xml="/fmi/xml/FMPXMLRESULT.xml";

//this likely won't change although 127.0.0.1 or the IP of this machine should work too.
$serverAddress="localhost";

//https if SSL
$http="http";

//could be 443 if SSL
$port=80;

//false if disable verifying a SSL/TLS certificate chain
$verifySSL=true;

$url="$http://$serverAddress$xml";

if (isset($_POST)){
$post = file_get_contents("php://input");

//extract so we can get $u $p and $l, and then clip off Payload before sending.
$a = array();
parse_str($post,$a);
extract($a);
$lgth = strlen($post);
//$l is extracted from the payload.
$post = substr($post,0,($lgth-$l));

//or hardcoded credentials
//disable these lines if passing u and p via POST
$u="fmxj";
$p="fmxj";

$c = curl_init();
curl_setopt($c, CURLOPT_URL, $url);
curl_setopt($c, CURLOPT_TIMEOUT, 40);
curl_setopt($c, CURLOPT_POST, true);
curl_setopt($c, CURLOPT_POSTFIELDS, $post);
curl_setopt($c, CURLOPT_USERPWD, $u . ":" . $p);
if ($verifySSL === false) {
    curl_setopt($c, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($c, CURLOPT_SSL_VERIFYHOST, 0);
}
curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
$result=curl_exec($c);
curl_close($c);
echo $result; 
};
