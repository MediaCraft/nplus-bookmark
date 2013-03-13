<?php
class Npm_Api
{
	private
		$_is_debug_mode = false,
		$_params,
		$_valid_domain = null;
	
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
		if (!$this->validateRequest())
		{
			throw new Npm_Exception('Invalid request');
		}

		$params = $this->_buildParams($this->_params);
		
		$params['client_id'] = $client_id;
		$params['client_secret'] = $client_secret;
		
		if($token)
		{
			$params['token'] = $token;
		}

		try
		{
			return $this->_requestFunction($this->_buildParams($params));
		}
		catch (Exception $e)
		{
			return array('error' => $e->getMessage());
		}
	}
	
	public function enableDebugMode()
	{
		$this->_is_debug_mode = true;
	}
	
	/**
	 * XMLHttpRequest 経由でのリクエストの場合に必要なセキュリティチェックを有効にする
	 * 
	 * $valid_domain には API リクエストを受け付けるドメイン（Npm_Api::request を使用する PHP が動いているサーバのドメイン）を渡します
	 * DNS リバインディング対策にも利用しているため $_SERVER['HTTP_HOST'] から取得した値は使用しないでください
	 * （"www1.example.com" "www2.example.com" など複数のホスト名からアクセスされる可能性がある場合は ".example.com" を渡してください）
	 * また、XMLHttpRequest でリクエストする際に X-Requested-With: XMLHttpRequest を付与してください
	 * クロスドメイン通信は許可されません
	 * @param string $valid_domain リクエスト先ドメイン（後方一致）
	 */
	public function enableXHRProtection($valid_domain)
	{
		$this->_valid_domain = strtolower($valid_domain);
	}
	
	/**
	 * 現在のリクエストが必要な条件を満たしているか検証する
	 * @return boolean
	 */
	public function validateRequest()
	{
		//enableXHRProtection を呼んでいない場合は全て許可
		if ($this->_valid_domain === null)
		{
			return true;
		}

		//DNS リバインディング対策
		if (!isset($_SERVER['HTTP_HOST']) || (strtolower(substr($_SERVER['HTTP_HOST'], -strlen($this->_valid_domain))) != $this->_valid_domain))
		{
			return false;
		}
		
		//XMLHttpRequest からのリクエストかどうかを検証
		if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest')
		{
			return false;
		}

		//リクエストメソッドを検証
		if (!isset($_SERVER['REQUEST_METHOD']) || (strtolower($_SERVER['REQUEST_METHOD']) != 'post'))
		{
			return false;
		}

		//リクエスト元を検証　※意図せず OPTIONS で許可してしまっていた場合
		if (isset($_SERVER['HTTP_ORIGIN']))
		{
			$m = null;
			if (!preg_match('/^https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)*(?:[a-zA-Z0-9-]+)/', $_SERVER['HTTP_ORIGIN'], $m))
			{
				return false;
			}

			if (strtolower(substr($m[0], -strlen($this->_valid_domain))) != $this->_valid_domain)
			{
				return false;
			}
		}

		return true;
	}

	private function _requestFunction(&$params)
	{
		$uri = Npm_Uri::getInstance()->getApi('1.0');
		$options = array('http' => array(
				'method' => 'POST',
				'content' => http_build_query($params),
				'header' => implode("\r\n", array('Content-type: application/x-www-form-urlencoded; charset=utf-8')),
		));
		
		$resp = json_decode(file_get_contents($uri, false, stream_context_create($options)), true);
		
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