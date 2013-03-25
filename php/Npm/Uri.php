<?php
class Npm_Uri
{
	const PREPEND_PC = '';
	const PREPEND_MOBILE = '/m';
	const PREPEND_SP = '/sp';
	
	private static $_instance;
	
	private	$_debug_mode = false;
	private $_base_uri = 'https://n-plus.me';
	
	private function __construct()
	{
		
	}
	
	/**
	 * @return Npm_Uri
	 */
	public static function getInstance()
	{
		if(!self::$_instance)
		{
			self::$_instance = new Npm_Uri();
		}
		
		return self::$_instance;
	}
	
// 	public function enableTestMode()
// 	{
// 		$this->_test_mode = true;
// 	}
	
	public function enableDebugMode()
	{
		$this->_debug_mode = true;
	}
	
	public function isDebugMode()
	{
		return $this->_debug_mode;
	}
	
	public function getForPc($path, array $params = array())
	{
		return $this->_buildUri(self::PREPEND_PC, $path, $params);
	}
	
	public function getForMobile($path, array $params = array())
	{
		return $this->_buildUri(self::PREPEND_MOBILE, $path, $params);
	}
	
	public function getForSp($path, array $params = array())
	{
		return $this->_buildUri(self::PREPEND_SP, $path, $params);
	}
	
	public function getApi($version)
	{
		return self::getBaseUri().'/api/client/'.$version;
	}
	
	public function getPathPc($path, array $params = array())
	{
		return $this->_buildPath(self::PREPEND_PC, $path, $params);
	}
	
	public function getPathMobile($path, array $params = array())
	{
		return $this->_buildPath(self::PREPEND_MOBILE, $path, $params);
	}
	
	public function getPathSp($path, array $params = array())
	{
		return $this->_buildPath(self::PREPEND_SP, $path, $params);
	}
	
	public function setBaseUri($uri)
	{
		$this->_base_uri = $uri;
		
		return $this;
	}
	
	public function getBaseUri()
	{
		return $this->_base_uri;
	}
	
// private ////////////////////////////////////////////////////////////////////
	
	private function _buildUri($prepend, $path , array $params = array())
	{
		return self::getBaseUri().$this->_buildPath($prepend, $path, $params);
	}
	
	private function _buildPath($prepend, $path , array $params = array())
	{
		//$pathの先頭が/で始まっていなかったら、/を付ける。
		$path = (strpos($path, '/', 0) === 0) ? $path : '/'.$path;
		
		//$paramsの中にclient_idがあったら、pathに加えた表記に直す。
		if(isset($params['client_id']))
		{
			$path = '/'.$params['client_id'].$path;
			unset($params['client_id']);
		}
		
		//クエリの付加
		if($params)	$path .= '?'.http_build_query($params);
		
		return $prepend.$path;
	}
}