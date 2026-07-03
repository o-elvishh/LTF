$url = 'https://script.google.com/macros/s/AKfycby51KlpO_xht7RAYt49CgSWX_b-Lek_cOK3vRBe3Pq4kyluDBGM4Z13FakDDeKd7Xc/exec'

$data = [ordered]@{
  version = 'A'
  nombre = 'PRUEBA CODEX'
  correo = 'prueba.codex@example.com'
}

1..32 | ForEach-Object {
  $data["p$_"] = 'A'
}

$data['bp1'] = 'Lavado de manos'
$data['bp2'] = 'Uso de bata y guantes'
$data['bp3'] = 'Desinfeccion de superficies'
$data['bp4'] = 'Manejo correcto de residuos'

$body = $data | ConvertTo-Json -Depth 5 -Compress

Invoke-WebRequest `
  -UseBasicParsing `
  -Uri $url `
  -Method POST `
  -Body $body `
  -ContentType 'text/plain;charset=utf-8' |
  Select-Object -ExpandProperty Content
