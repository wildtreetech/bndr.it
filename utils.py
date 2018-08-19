from w3lib.url import canonicalize_url


def normalise_uri(uri):
    uri = uri.replace("//", "/")
    return canonicalize_url(uri, keep_fragments=True)


DEFAULT_ALPHABET = 'mn6j2c4rv8bpygw95z7hsdaetxuk3fq'
DEFAULT_BLOCK_SIZE = 24

# Author: Michael Fogleman
# License: MIT
# Link: http://code.activestate.com/recipes/576918/
class IntEncoder(object):
    def __init__(self, alphabet=DEFAULT_ALPHABET,
                 block_size=DEFAULT_BLOCK_SIZE,
                 min_length=4):
        self.alphabet = alphabet
        self.block_size = block_size
        self.min_length = min_length
        self.mask = (1 << block_size) - 1
        self.mapping = list(range(block_size))
        self.mapping.reverse()

    def encode_url(self, n):
        return self.enbase(self.encode(n))

    def decode_url(self, n):
        return self.decode(self.debase(n))

    def encode(self, n):
        return (n & ~self.mask) | self._encode(n & self.mask)

    def _encode(self, n):
        result = 0
        for i, b in enumerate(self.mapping):
            if n & (1 << i):
                result |= (1 << b)
        return result

    def decode(self, n):
        return (n & ~self.mask) | self._decode(n & self.mask)

    def _decode(self, n):
        result = 0
        for i, b in enumerate(self.mapping):
            if n & (1 << b):
                result |= (1 << i)
        return result

    def enbase(self, x):
        result = self._enbase(x)
        padding = self.alphabet[0] * (self.min_length - len(result))
        return '%s%s' % (padding, result)

    def _enbase(self, x):
        n = len(self.alphabet)
        if x < n:
            return self.alphabet[x]
        return self._enbase(x // n) + self.alphabet[x % n]

    def debase(self, x):
        n = len(self.alphabet)
        result = 0
        for i, c in enumerate(reversed(x)):
            result += self.alphabet.index(c) * (n ** i)
        return result
