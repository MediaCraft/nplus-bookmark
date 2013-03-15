<?php
class Npm_Uri
{
	const DOMAIN = 'n-plus.me';
	const PREPEND_PC = '';
	const PREPEND_MOBILE = '/m';
	const PREPEND_SP = '/sp';
	
	private static $_instance;
	
	private	$_test_mode = false;
	private	$_debug_mode = false;
	
	
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
	
	public function forceServer($value)
	{
		if($value == 'clear')
		{
			unset($_SESSION['npm']['server']);
		}
		else
		{
			$_SESSION['npm']['server'] = $value;
		}
	}
	
	public function enableTestMode()
	{
		$this->_test_mode = true;
	}
	
	public function enableDebugMode()
	{
		$this->_debug_mode = true;
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
		return $this->_bildPath(self::PREPEND_PC, $path, $params);
	}
	
	public function getPathMobile($path, array $params = array())
	{
		return $this->_bildPath(self::PREPEND_MOBILE, $path, $params);
	}
	
	public function getPathSp($path, array $params = array())
	{
		return $this->_bildPath(self::PREPEND_SP, $path, $params);
	}
	
	public function getBaseUri()
	{
		if(isset($_SESSION['npm']['server']))
		{
			return $_SESSION['npm']['server'];
		}
		
		$base_uri = self::DOMAIN;
		if($this->_test_mode) $base_uri = 'test.'.$base_uri;
		if($this->_debug_mode) $base_uri = 'dev.'.$base_uri;
	
		return (($this->_test_mode) ? 'http://' : 'https:').$base_uri;
	}
	
// private ////////////////////////////////////////////////////////////////////
	
	private function _buildUri($prepend, $path , array $params = array())
	{
		return self::getBaseUri().$this->_bildPath($prepend, $path, $params);
	}
	
	private function _bildPath($prepend, $path , array $params = array())
	{
		//$pathの先頭が/で始まっていなかったら、/を付ける。
		$path = (strpos($path, '/', 0) === 0) ? $path : '/'.$path;
		
		//$paramsの中にclient_idがあったら、pathに加えた表記に直す。
		if(isset($params['client_id']))
		{
			$path = sprintf('%d/%s', $params['client_id'], $path);
			unset($params['client_id']);
		}
		
		//クエリの付加
		if($params)	$path .= '?'.http_build_query($params);
		
		return $prepend.$path;
	}
}