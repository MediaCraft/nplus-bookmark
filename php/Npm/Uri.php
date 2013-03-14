<?php
class Npm_Uri
{
	private static $_instance;
	
	private
		$_test_mode = false;
	
	
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
	
	public function getForPc($path, array $params = array())
	{
		return $this->_buildUri('/', $path, $params);
	}
	
	public function getForMobile($path, array $params = array())
	{
		return $this->_buildUri('/m/', $path, $params);
	}
	
	public function getForSp($path, array $params = array())
	{
		return $this->_buildUri('/sp/', $path, $params);
	}
	
	public function getApi($version)
	{
		return self::_getBaseUri().'/api/client/'.$version;
	}
	
	private function _getBaseUri()
	{
		if(isset($_SESSION['npm']['server']))
		{
			return $_SESSION['npm']['server'];
		}
		
		return ($this->_test_mode ? 'http://test.n-plus.me' : 'https://n-plus.me');
	}
	
	private function _buildUri($prepend, $path , array $params = array())
	{
		$path = sprintf('%d/%s', $params['client_id'], $path);
		unset($params['client_id']);
		$uri = self::_getBaseUri().$prepend. $path;
		
		if($params)
		{
			$uri .= '?'.http_build_query($params);
		}
		
		return $uri;
	}
}