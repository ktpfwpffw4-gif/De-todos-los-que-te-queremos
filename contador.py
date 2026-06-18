contador = 0

numero = int(input("Ingrese un número (0 para terminar): "))

while numero != 0:
    if numero < 0:
        contador += 1

    numero = int(input("Ingrese otro número (0 para terminar): "))

print("Cantidad de números negativos:", contador)