<?php
class Npm_Api
{
	private
		$_is_debug_mode = false,
		$_params;
	
	/**
	 * 
	 * @param array $params
	 * @param string $function
	 * @return Npm_Api
	 */
	public static function create(array $params, $function = null)
	{
		if(!isset($function))
		{
			$function = $params['function'];
		}
		else
		{
			$params['function'] = $function;
		}
		
		//$class = 'Npm_Api_'.self::_camelize($function);
		
		return new Npm_Api($params);
	}
	
	
	public function __construct(array &$params)
	{
		$this->_params = $params;
	}
	
	protected function _buildParams(array &$params)
	{
		return $params;
	}
	
	public function request($client_id, $client_secret, $token = null)
	{
		$params = $this->_buildParams($this->_params);
		
		$params['client_id'] = $client_id;
		$params['client_secret'] = $client_secret;
		
		if($token)
		{
			$params['token'] = $token;
		}
		
		return $this->_requestFunction($this->_buildParams($params));
	}
	
	public function enableDebugMode()
	{
		$this->_is_debug_mode = true;
	}
	
	private function _requestFunction(&$params)
	{
		$uri = 'http://test.n-plus.me/api/client/1.0';
		$options = array('http' => array(
				'method' => 'POST',
				'content' => http_build_query($params),
				'header' => implode("\r\n", array('Content-type: application/x-www-form-urlencoded; charset=utf-8')),
		));
		
		$resp = json_decode(file_get_contents($uri, false, stream_context_create($options)), true);
		
		
		if(!empty($resp['error']))
		{
			throw new Npm_Exception('Api response has error, '.$resp['error']['message'].' url:'.$uri.'?'.$options['http']['content']);
		}
		
		if($this->_is_debug_mode)
		{
			$resp['debug'] = array(
				'uri' => $uri,
				'detail' => $options['http']
			);
		}
		
		return $resp;
	}
	
	private static function _camelize($string)
	{
		$replacePairs = array(
				'/(^|-)+(.)/e' => "strtoupper('\\2')"
		);
	
		return preg_replace(array_keys($replacePairs), array_values($replacePairs), $string);
	}
}